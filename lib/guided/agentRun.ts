// State machine for a "Do things for me" run. Pure: every action that affects
// timing carries its own timestamp.

export type AgentStatus =
  | 'scoping'
  | 'awaiting-permission'
  | 'running'
  | 'paused'
  | 'blocked'
  | 'done'
  | 'error';

export type AgentPhase = 'plan' | 'search' | 'read' | 'data' | 'write';

/** `web` jobs read public pages; `data` jobs work on what the user attached. */
export type AgentKind = 'web' | 'data';

export const PHASES: Record<AgentKind, AgentPhase[]> = {
  web: ['plan', 'search', 'read', 'write'],
  data: ['plan', 'data', 'write'],
};

export interface CheckIn {
  toolUseId: string;
  headline: string;
  detail: string;
  label: string;
  options: string[];
}

export interface AgentSource {
  url: string;
  title: string;
}

export interface AgentRun {
  status: AgentStatus;
  kind: AgentKind;
  ask: string;
  /** Index into PHASES[kind] of the step being worked on. */
  currentStep: number;
  /** Web searches made so far, in plain words. */
  searches: string[];
  pagesRead: number;
  /** Instructions the user added while the run was going. */
  notes: string[];
  blockingQuestion: CheckIn | null;
  result: string | null;
  model: string | null;
  sources: AgentSource[];
  error: string | null;
  /** Time spent actually working (excludes paused and blocked time). */
  durationMs: number;
  runningSince: number | null;
}

export type AgentAction =
  | { type: 'request-permission' }
  | { type: 'allow'; at: number }
  | { type: 'decline' }
  | { type: 'phase'; phase: AgentPhase }
  | { type: 'search'; query: string }
  | { type: 'pages'; count: number }
  | { type: 'note'; text: string }
  | { type: 'check-in'; question: CheckIn; at: number }
  | { type: 'answer-check-in'; at: number }
  | { type: 'pause'; at: number }
  | { type: 'resume'; at: number }
  | { type: 'done'; result: string; model: string; sources: AgentSource[]; at: number }
  | { type: 'fail'; message: string; at: number };

export function createRun(ask: string, kind: AgentKind): AgentRun {
  return {
    status: 'scoping',
    kind,
    ask,
    currentStep: 0,
    searches: [],
    pagesRead: 0,
    notes: [],
    blockingQuestion: null,
    result: null,
    model: null,
    sources: [],
    error: null,
    durationMs: 0,
    runningSince: null,
  };
}

function stopClock(run: AgentRun, at: number): Pick<AgentRun, 'durationMs' | 'runningSince'> {
  const elapsed = run.runningSince === null ? 0 : Math.max(0, at - run.runningSince);
  return { durationMs: run.durationMs + elapsed, runningSince: null };
}

/** Transitions that are not allowed from the current status leave the run unchanged. */
export function agentReducer(run: AgentRun, action: AgentAction): AgentRun {
  switch (action.type) {
    case 'request-permission':
      return run.status === 'scoping' ? { ...run, status: 'awaiting-permission' } : run;

    case 'allow':
      return run.status === 'awaiting-permission'
        ? { ...run, status: 'running', runningSince: action.at }
        : run;

    case 'decline':
      return run.status === 'awaiting-permission' ? { ...run, status: 'scoping' } : run;

    case 'phase': {
      if (run.status !== 'running') return run;
      const index = PHASES[run.kind].indexOf(action.phase);
      if (index < 0) return run;
      // Progress only moves forward, except that an early "writing" guess can
      // be walked back when the agent turns out to need another look.
      const writing = PHASES[run.kind].length - 1;
      if (index < run.currentStep && run.currentStep !== writing) return run;
      return { ...run, currentStep: index };
    }

    case 'search':
      return run.status === 'running' && action.query.trim()
        ? { ...run, searches: [...run.searches, action.query.trim()] }
        : run;

    case 'pages':
      return run.status === 'running' && action.count > 0
        ? { ...run, pagesRead: run.pagesRead + action.count }
        : run;

    case 'note':
      return ['running', 'paused', 'awaiting-permission', 'scoping'].includes(run.status) && action.text.trim()
        ? { ...run, notes: [...run.notes, action.text.trim()] }
        : run;

    case 'check-in':
      return run.status === 'running'
        ? { ...run, status: 'blocked', blockingQuestion: action.question, ...stopClock(run, action.at) }
        : run;

    case 'answer-check-in':
      return run.status === 'blocked'
        ? { ...run, status: 'running', blockingQuestion: null, runningSince: action.at }
        : run;

    case 'pause':
      return run.status === 'running' ? { ...run, status: 'paused', ...stopClock(run, action.at) } : run;

    case 'resume':
      // Resuming (after a pause, an added note, or an error) starts the job
      // again from the top, so progress resets while time worked is kept.
      return run.status === 'paused' || run.status === 'error'
        ? {
            ...run,
            status: 'running',
            currentStep: 0,
            searches: [],
            pagesRead: 0,
            error: null,
            runningSince: action.at,
          }
        : run;

    case 'done':
      return run.status === 'running'
        ? {
            ...run,
            status: 'done',
            currentStep: PHASES[run.kind].length,
            result: action.result,
            model: action.model,
            sources: action.sources,
            ...stopClock(run, action.at),
          }
        : run;

    case 'fail':
      return run.status === 'running' || run.status === 'blocked'
        ? { ...run, status: 'error', error: action.message, blockingQuestion: null, ...stopClock(run, action.at) }
        : run;

    default:
      return run;
  }
}

export interface AgentStep {
  phase: AgentPhase;
  state: 'done' | 'current' | 'pending';
}

export function agentSteps(run: AgentRun): AgentStep[] {
  return PHASES[run.kind].map((phase, index) => ({
    phase,
    state: index < run.currentStep ? 'done' : index === run.currentStep ? 'current' : 'pending',
  }));
}

/** The ask plus anything the user added mid-run, as one instruction for the agent. */
export function askWithNotes(run: Pick<AgentRun, 'ask' | 'notes'>): string {
  if (!run.notes.length) return run.ask;
  return `${run.ask}\n\nAlso keep in mind:\n${run.notes.map((n) => `- ${n}`).join('\n')}`;
}
