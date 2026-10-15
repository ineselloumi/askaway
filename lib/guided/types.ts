// Shared types for the guided first-prompt flow.

export type TaskCategory = 'write' | 'understand' | 'agentic';

/** Translator signature used across the guided flow (matches LocaleContext's `t`). */
export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export interface OptionDef {
  id: string;
}

export interface QuestionDef {
  id: string;
  options: OptionDef[];
  /** Multi-select questions count once toward readiness and need an explicit "that's all". */
  multi?: boolean;
  /** Show the dashed "Type instead" / "Add your own" chip. */
  custom?: boolean;
  /**
   * Answered by typing in the prompt itself: the clause's lead-in (" about ")
   * is written into the editor and the user fills in the rest. Like multi,
   * it stays open until confirmed.
   */
  blank?: boolean;
}

export interface VariantDef {
  questions: QuestionDef[];
  /** Default chips (ids in lib/guided/library.ts), shown until the decision model ranks the library. */
  suggestions: string[];
  /** Agentic only: the job reads public web pages. */
  web?: boolean;
  /** Agentic only: the job works on data the user attaches or pastes. */
  attach?: boolean;
}

export interface FlowDef {
  category: TaskCategory;
  q1: QuestionDef;
  /** Keyed by the q1 option id, plus `custom` for a typed q1 answer. */
  variants: Record<string, VariantDef>;
}

/** One answer. `fragment` is what gets written into the prompt, `label` is what the chip shows. */
export interface AnswerValue {
  optionId?: string;
  label: string;
  fragment: string;
}

export type Answers = Record<string, AnswerValue | AnswerValue[]>;

export interface Segment {
  text: string;
  /** Answer-derived fragments are underlined in the prompt builder. */
  kind: 'plain' | 'answer';
}

export interface ComposedPrompt {
  segments: Segment[];
  /** Plain text of `segments`. */
  text: string;
  /** Muted hint rendered after the text (never sent). */
  ghost: string;
  /** Dangling lead-in placed in the editor on the last step; only sent if the user types after it. */
  closer: string;
  /** While a blank question is asked: where the user's typed answer starts in `text`. */
  blankAt?: number;
}
