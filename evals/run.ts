// AskAway eval runner
// Usage: npx tsx evals/run.ts
// Options:
//   VERBOSE=1    → print detail for all cases (not just failures)
//   SUITE=draft  → run only one suite (check-ready | draft | next-question)
//   API_BASE=... → override API base URL (default: http://localhost:3000)

import { checkReadyCases } from './fixtures/check-ready';
import { draftCases } from './fixtures/draft';
import { nextQuestionCases } from './fixtures/next-question';
import {
  assertBoolean,
  assertNoForbiddenTopics,
  assertSuggestionLength,
  llmJudge,
  printSummary,
  type EvalResult,
} from './score';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const SUITE = process.env.SUITE;

async function callAPI(body: object): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Suite: check-ready ---

async function runCheckReady(): Promise<EvalResult[]> {
  console.log('\n📋 Running check-ready suite...');
  const results: EvalResult[] = [];

  for (const c of checkReadyCases) {
    process.stdout.write(`  [${c.id}] ${c.description}... `);
    try {
      const response = await callAPI({
        action: 'check-ready',
        message: '',
        situation: c.situation,
        answers: c.answers,
      }) as { ready: boolean };

      const assertion = assertBoolean(response.ready, c.expectReady);
      const pass = assertion.pass;
      console.log(pass ? 'PASS' : `FAIL (got ready=${response.ready}, expected ${c.expectReady})`);

      results.push({
        id: c.id,
        description: c.description,
        pass,
        detail: pass
          ? `ready=${response.ready} ✓`
          : `Expected ready=${c.expectReady}, got ready=${response.ready}`,
      });
    } catch (err) {
      console.log('ERROR');
      results.push({ id: c.id, description: c.description, pass: false, detail: String(err) });
    }
  }

  return results;
}

// --- Suite: draft ---

async function runDraft(): Promise<EvalResult[]> {
  console.log('\n✍️  Running draft suite...');
  const results: EvalResult[] = [];

  for (const c of draftCases) {
    process.stdout.write(`  [${c.id}] ${c.description}... `);
    try {
      const response = await callAPI({
        action: 'draft',
        message: c.message,
        situation: c.situation,
        answers: c.answers,
      }) as { draft: string };

      const judged = await llmJudge(response.draft, c.rubric);
      console.log(`score=${judged.score}/5 ${judged.pass ? 'PASS' : 'FAIL'} — ${judged.reasoning}`);

      results.push({
        id: c.id,
        description: c.description,
        pass: judged.pass,
        detail: `Score ${judged.score}/5: ${judged.reasoning}\n     Output: ${response.draft.slice(0, 120)}...`,
      });
    } catch (err) {
      console.log('ERROR');
      results.push({ id: c.id, description: c.description, pass: false, detail: String(err) });
    }
  }

  return results;
}

// --- Suite: next-question ---

async function runNextQuestion(): Promise<EvalResult[]> {
  console.log('\n❓ Running next-question suite...');
  const results: EvalResult[] = [];

  for (const c of nextQuestionCases) {
    process.stdout.write(`  [${c.id}] ${c.description}... `);
    try {
      const response = await callAPI({
        action: 'next-question',
        message: '',
        situation: c.situation,
        answers: c.answers,
        questionNumber: c.questionNumber,
      }) as { question: string; suggestions: string[] };

      // Run assertions
      const issues: string[] = [];

      if (c.forbiddenTopics && c.forbiddenTopics.length > 0) {
        const check = assertNoForbiddenTopics(response.question, c.forbiddenTopics);
        if (!check.pass) issues.push(`Repeated topics: ${(check.actual as string[]).join(', ')}`);
      }

      const lengthCheck = assertSuggestionLength(response.suggestions ?? []);
      if (!lengthCheck.pass) issues.push(`Suggestions too long: ${lengthCheck.note}`);

      // LLM judge for quality
      const outputText = `Question: ${response.question}\nSuggestions: ${(response.suggestions ?? []).join(', ')}`;
      const judged = await llmJudge(outputText, c.rubric);
      if (!judged.pass) issues.push(`Quality score ${judged.score}/5: ${judged.reasoning}`);

      const pass = issues.length === 0;
      console.log(pass ? `PASS (score=${judged.score}/5)` : `FAIL`);

      results.push({
        id: c.id,
        description: c.description,
        pass,
        detail: pass
          ? `score=${judged.score}/5: ${judged.reasoning}`
          : issues.join(' | '),
      });
    } catch (err) {
      console.log('ERROR');
      results.push({ id: c.id, description: c.description, pass: false, detail: String(err) });
    }
  }

  return results;
}

// --- Main ---

async function main() {
  console.log(`\n🚀 AskAway Evals — ${new Date().toISOString()}`);
  console.log(`   API: ${API_BASE}`);
  if (SUITE) console.log(`   Suite filter: ${SUITE}`);

  const allResults: EvalResult[] = [];

  if (!SUITE || SUITE === 'check-ready') allResults.push(...await runCheckReady());
  if (!SUITE || SUITE === 'draft') allResults.push(...await runDraft());
  if (!SUITE || SUITE === 'next-question') allResults.push(...await runNextQuestion());

  // Save results to evals/results/
  const resultsDir = path.join(import.meta.dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  const filename = path.join(resultsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(filename, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Results saved to ${filename}`);

  printSummary(allResults);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
