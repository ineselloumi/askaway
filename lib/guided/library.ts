// The chip and hint library behind the prompt builder. Each entry's copy is in
// messages/guided/en.json under `guided.chips.<id>` and `guided.hints.<id>`.
import type { TaskCategory } from './types';

export interface LibraryEntry {
  categories: TaskCategory[];
  /** What the entry means, in plain words. Sent to the decision model, never shown. */
  about: string;
}

/** "Anything else worth knowing" chips: a label plus a sentence starter added to the prompt. */
export const CHIPS: Record<string, LibraryEntry> = {
  deadline: { categories: ['write'], about: "A deadline or date the reader needs to know" },
  ask: { categories: ['write'], about: "What the writer needs the reader to do" },
  tone: { categories: ['write'], about: "The tone of the writing" },
  length: { categories: ['write'], about: "How long the piece should be" },
  points: { categories: ['write'], about: "The specific points the piece must cover" },
  data: { categories: ['write'], about: "Figures or data the piece should include" },
  focus: { categories: ['write', 'understand'], about: "What to focus on" },
  decisions: { categories: ['write'], about: "Decisions to highlight" },
  goal: { categories: ['write'], about: "The decision the research plan should inform" },
  timeline: { categories: ['write'], about: "The timeline for the work" },
  methods: { categories: ['write'], about: "Research methods to use" },
  context: { categories: ['write', 'understand'], about: "Background the reader needs about the situation" },
  outcome: { categories: ['write'], about: "What the reader should do or think after reading" },
  recap: { categories: ['write'], about: "What was discussed or agreed in a meeting" },
  nextSteps: { categories: ['write'], about: "Next steps that were agreed" },
  progress: { categories: ['write'], about: "What got done in the period being reported" },
  blockers: { categories: ['write'], about: "Blockers or risks to flag" },
  upcoming: { categories: ['write'], about: "Plans for the next period" },
  role: { categories: ['understand'], about: "The person's job or role" },
  purpose: { categories: ['understand', 'agentic'], about: "What the result will be used for or which decision it supports" },
  answerLength: { categories: ['understand'], about: "How long the answer should be" },
  reader: { categories: ['understand'], about: "Who will read the result" },
  skip: { categories: ['understand'], about: "What to leave out" },
  register: { categories: ['understand'], about: "The register or tone of a translation" },
  keep: { categories: ['understand'], about: "Terms to keep untranslated" },
  question: { categories: ['understand'], about: "The specific question the person wants answered" },
  concern: { categories: ['understand'], about: "What worries the person about it" },
  attendees: { categories: ['understand'], about: "Who was in the meeting" },
  owners: { categories: ['understand'], about: "Who owns each action item" },
  handback: { categories: ['agentic'], about: "What form the result should take, such as a table, a shortlist or a recommendation" },
  current: { categories: ['agentic'], about: "What the person or team uses today" },
  when: { categories: ['agentic'], about: "When the result is needed by" },
  whoWeAre: { categories: ['agentic'], about: "Who the company is and what it sells, so \"our\" and \"we\" can be understood" },
  shortlist: { categories: ['agentic'], about: "Which specific companies, products or options to include" },
  compareOn: { categories: ['agentic'], about: "Which dimensions to compare on, such as pricing, features, positioning or market share" },
  budget: { categories: ['agentic'], about: "The budget available" },
  region: { categories: ['agentic'], about: "The region or market to focus on" },
  audience: { categories: ['agentic'], about: "Who will see the presentation" },
  presentLength: { categories: ['agentic'], about: "How long the presentation is" },
  keyMessage: { categories: ['agentic'], about: "The one message the deck should leave" },
  metrics: { categories: ['agentic'], about: "Figures to include in the deck" },
  columns: { categories: ['agentic'], about: "What the spreadsheet columns mean" },
  decide: { categories: ['agentic'], about: "The decision the analysis supports" },
  period: { categories: ['agentic'], about: "The time period to focus on" },
};

/** Helper lines naming the single most useful thing to add. */
export const HINTS: Record<string, LibraryEntry> = {
  task: { categories: ['write', 'understand', 'agentic'], about: "It is unclear what the person wants produced or done" },
  preference: { categories: ['write'], about: "No preference is given about tone, length or what must be included" },
  manner: { categories: ['understand'], about: "It does not say how the answer should be delivered" },
  context: { categories: ['understand'], about: "It gives no background about the person or why they are asking" },
  constraints: { categories: ['agentic'], about: "It is choosing something to buy or use but states no requirement such as a budget or a must-have" },
  handback: { categories: ['agentic'], about: "It does not say what result to hand back, or when it is needed" },
  material: { categories: ['write', 'understand'], about: "It is missing the background or source material the job depends on: the text, notes, data or situation it refers to" },
  contractText: { categories: ['understand'], about: "It asks about a contract but the contract text has not been pasted in" },
  notesText: { categories: ['understand'], about: "It works from meeting notes but the notes have not been pasted in" },
  whoWeAre: { categories: ['agentic'], about: "It says \"our\" or \"we\" but never says what the company is or which market it is in" },
  compareOn: { categories: ['agentic'], about: "It asks for a comparison but does not say what to compare on" },
  readerAction: { categories: ['write'], about: "It is a message but does not say what the reader should do after reading it" },
  keyPoints: { categories: ['write'], about: "It does not say which points the piece must get across" },
  recap: { categories: ['write'], about: "It follows up on a meeting but does not say what was discussed or agreed" },
  statusContent: { categories: ['write'], about: "It is a status update but gives no progress, blockers or plans" },
  researchGoal: { categories: ['write'], about: "It is a research plan but does not say what decision it informs or by when" },
  keyMessage: { categories: ['agentic'], about: "It is a presentation but does not say its main message or its audience" },
  dataShape: { categories: ['agentic'], about: "It analyzes data but the data is not attached or the columns are not explained" },
  question: { categories: ['understand'], about: "It asks for an explanation but not the specific question the person has" },
};

/** Hand-written chips and hints for each idea on the setup screen, best first. */
export const IDEA_CONTENT: Record<string, { chips: string[]; hints: string[] }> = {
  followup: { chips: ['recap', 'nextSteps', 'ask', 'tone'], hints: ['recap', 'readerAction'] },
  status: { chips: ['progress', 'blockers', 'upcoming', 'deadline'], hints: ['statusContent'] },
  competitors: { chips: ['whoWeAre', 'shortlist', 'compareOn', 'purpose'], hints: ['whoWeAre', 'compareOn'] },
  deck: { chips: ['audience', 'keyMessage', 'metrics', 'presentLength'], hints: ['keyMessage'] },
  sheet: { chips: ['columns', 'decide', 'period', 'when'], hints: ['dataShape'] },
  contract: { chips: ['role', 'question', 'concern', 'answerLength'], hints: ['contractText', 'question'] },
  notes: { chips: ['attendees', 'owners', 'focus', 'skip'], hints: ['notesText'] },
  plan: { chips: ['goal', 'timeline', 'methods', 'context'], hints: ['researchGoal'] },
};
/** Jev's option for "nothing important is missing". */
export const NO_HINT = 'none';
export const NO_HINT_ABOUT = 'Nothing important is missing; the prompt is ready to send';

const forCategory = (table: Record<string, LibraryEntry>, category: TaskCategory) =>
  Object.keys(table).filter((id) => table[id].categories.includes(category));

/** The chips the decision model may choose from. Ideas keep to their own hand-written set. */
export function chipPool(category: TaskCategory, ideaId?: string | null): string[] {
  const idea = ideaId ? IDEA_CONTENT[ideaId] : undefined;
  return idea ? [...idea.chips] : forCategory(CHIPS, category);
}

/** The hints the decision model may choose from: an idea's own hints plus the general ones. */
export function hintPool(category: TaskCategory, ideaId?: string | null): string[] {
  const idea = ideaId ? IDEA_CONTENT[ideaId] : undefined;
  return [...new Set([...(idea?.hints ?? []), ...forCategory(HINTS, category)])];
}

/** Chips to show before the decision model has answered (or when it cannot). */
export function defaultChips(variantSuggestions: string[], ideaId?: string | null, count = 3): string[] {
  const idea = ideaId ? IDEA_CONTENT[ideaId] : undefined;
  return (idea ? idea.chips : variantSuggestions).slice(0, count);
}

/** Hint to show before the decision model has answered: an idea's first hand-written hint. */
export function defaultHint(ideaId?: string | null): string | null {
  return (ideaId && IDEA_CONTENT[ideaId]?.hints[0]) || null;
}

/**
 * The most useful chips first, by the decision model's probabilities. Ties
 * keep the pool's own order, so the hand-written order wins when unsure.
 */
export function rankChips(probabilities: Record<string, number>, pool: string[], count = 3): string[] {
  return pool
    .map((id, index) => ({ id, index, p: probabilities[id] ?? 0 }))
    .sort((a, b) => b.p - a.p || a.index - b.index)
    .slice(0, count)
    .map(({ id }) => id);
}

/** Below this, the model's top pick is too unsure to show; the default helper line shows instead. */
export const HINT_MIN = 0.35;

/** The hint to show, or null when nothing important is missing (or the model is unsure). */
export function chooseHint(probabilities: Record<string, number>, pool: string[]): string | null {
  let best: string | null = null;
  let bestP = 0;
  for (const id of [...pool, NO_HINT]) {
    const p = probabilities[id] ?? 0;
    if (p > bestP) {
      best = id;
      bestP = p;
    }
  }
  if (!best || best === NO_HINT || bestP < HINT_MIN) return null;
  return best;
}

/** Keep only ids that exist in a table and belong to the category; used to validate requests. */
export function validIds(ids: unknown, table: Record<string, LibraryEntry>, max = 60): string[] | null {
  if (!Array.isArray(ids) || ids.length > max) return null;
  const clean = ids.filter((id): id is string => typeof id === 'string' && id in table);
  return clean.length === ids.length ? [...new Set(clean)] : null;
}
