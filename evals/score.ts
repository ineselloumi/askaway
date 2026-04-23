// Scoring helpers for AskAway evals.
// Two modes:
//   - assertBoolean: simple pass/fail for deterministic outputs (e.g. check-ready)
//   - llmJudge: calls Claude to score free-text outputs against a rubric (1-5)

export type AssertResult = {
  pass: boolean;
  actual: unknown;
  expected: unknown;
  note?: string;
};

export type JudgeResult = {
  score: number;     // 1–5
  reasoning: string; // One-sentence explanation from the judge
  pass: boolean;     // score >= 3
};

export type EvalResult = {
  id: string;
  description: string;
  pass: boolean;
  detail: string;
};

// --- Simple assertions ---

export function assertBoolean(actual: boolean, expected: boolean, note?: string): AssertResult {
  return { pass: actual === expected, actual, expected, note };
}

export function assertSuggestionLength(suggestions: string[], maxWords = 6): AssertResult {
  const tooLong = suggestions.filter(s => s.split(' ').length > maxWords);
  return {
    pass: tooLong.length === 0,
    actual: tooLong,
    expected: `All suggestions ≤ ${maxWords} words`,
    note: tooLong.length > 0 ? `Too long: ${tooLong.join(', ')}` : undefined,
  };
}

export function assertNoForbiddenTopics(text: string, forbiddenTopics: string[]): AssertResult {
  const lower = text.toLowerCase();
  const found = forbiddenTopics.filter(t => lower.includes(t.toLowerCase()));
  return {
    pass: found.length === 0,
    actual: found,
    expected: 'No forbidden topics repeated',
    note: found.length > 0 ? `Repeated: ${found.join(', ')}` : undefined,
  };
}

// --- LLM-as-judge ---

export async function llmJudge(output: string, rubric: string): Promise<JudgeResult> {
  const apiKey = process.env.ASK_AWAY_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No Anthropic API key found. Set ASK_AWAY_ANTHROPIC_KEY or ANTHROPIC_API_KEY.');

  const prompt = `You are evaluating an AI assistant's output. Score it 1-5 based on this rubric:

${rubric}

Output to evaluate:
"""
${output}
"""

Respond ONLY in this JSON format: {"score": <1-5>, "reasoning": "<one concise sentence>"}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Judge API error');

  const text: string = data.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Could not parse judge response: ${text}`);

  const { score, reasoning } = JSON.parse(match[0]);
  return { score, reasoning, pass: score >= 3 };
}

// --- Pretty printing ---

export function printSummary(results: EvalResult[]) {
  const passed = results.filter(r => r.pass).length;
  const total = results.length;

  console.log('\n' + '─'.repeat(70));
  console.log(`EVAL SUMMARY: ${passed}/${total} passed\n`);

  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon}  [${r.id}] ${r.description}`);
    if (!r.pass || process.env.VERBOSE) {
      console.log(`     ${r.detail}`);
    }
  }

  console.log('─'.repeat(70));

  if (passed < total) {
    console.log(`\n${total - passed} case(s) failed. Run with VERBOSE=1 for full output.\n`);
    process.exit(1);
  } else {
    console.log('\nAll cases passed! 🎉\n');
  }
}
