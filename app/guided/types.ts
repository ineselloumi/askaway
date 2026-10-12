import type { AgentSource } from '@/lib/guided/agentRun';
import type { TaskCategory } from '@/lib/guided/types';

export interface Attachment {
  name: string;
  text: string;
}

/** One entry in the conversation thread. */
export interface ThreadItem {
  id: string;
  role: 'user' | 'assistant' | 'notice';
  text: string;
  /** User message built with the guided flow: rendered as "the ask you just built". */
  guided?: boolean;
  agentic?: boolean;
  images?: string[];
  attachment?: Attachment;
  /** Assistant: which model answered, and why it was picked. */
  model?: string;
  reason?: string;
  /** Assistant, agent runs: what the job took. */
  receipt?: { pages: number; ms: number };
  sources?: AgentSource[];
  /** Notice: offer to try the last request again. */
  retry?: boolean;
}

export interface ConversationMeta {
  category: TaskCategory | 'chat';
  /** Messages in this conversation are jobs for the agent. */
  agentic: boolean;
  /** Agent job type (research, deck, sheet, custom). */
  job: string;
  kind: 'web' | 'data';
  /** The user has allowed the agent to work in this conversation. */
  granted: boolean;
  /** The prompt built in the guided flow, until it has been counted towards graduation. */
  guidedPrompt: string | null;
}

export const PLAIN_META: ConversationMeta = {
  category: 'chat',
  agentic: false,
  job: 'custom',
  kind: 'web',
  granted: false,
  guidedPrompt: null,
};
