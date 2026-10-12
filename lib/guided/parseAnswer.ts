export interface CompareRow {
  name: string;
  facts: string;
  /** Ruled out: rendered dimmed. */
  out: boolean;
}

export interface ParsedAnswer {
  /** One bold line shown above the answer. Empty when the model gave none. */
  lead: string;
  body: string;
  rows: CompareRow[];
}

const COMPARE = /\[\[compare\]\]([\s\S]*?)\[\[\/compare\]\]/i;
const MAX_LEAD = 160;

/**
 * Answers come back as: a short lead line, a blank line, the answer itself,
 * and (for comparisons) an optional `[[compare]]` block of `Name | facts | ok|out`
 * rows. Anything that does not follow the format is shown as plain body text.
 */
export function parseAnswer(raw: string): ParsedAnswer {
  let text = (raw ?? '').replace(/\r\n/g, '\n').trim();

  const rows: CompareRow[] = [];
  const match = text.match(COMPARE);
  if (match) {
    for (const line of match[1].split('\n')) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length < 2 || !parts[0]) continue;
      rows.push({ name: parts[0], facts: parts[1], out: /^(out|no|x)$/i.test(parts[2] ?? '') });
    }
    text = text.replace(COMPARE, '').trim();
  }
  // A block the model opened but never closed is dropped rather than shown raw.
  text = text.replace(/\[\[compare\]\][\s\S]*$/i, '').trim();

  const breakAt = text.indexOf('\n\n');
  if (breakAt > 0) {
    const first = text.slice(0, breakAt).trim();
    const rest = text.slice(breakAt).trim();
    if (rest && !first.includes('\n') && first.length <= MAX_LEAD && !/^([-*•]|\d+[.)])\s/.test(first)) {
      return { lead: first.replace(/^#+\s*/, '').replace(/\*\*/g, ''), body: rest, rows };
    }
  }
  return { lead: '', body: text, rows };
}
