// Eval cases for the "check-ready" action.
// Tests whether the model correctly decides it has enough info to generate vs. ask another question.
// expectReady: true  → model should decide it has enough info and generate
// expectReady: false → model should ask another clarifying question

export type CheckReadyCase = {
  id: string;
  description: string;
  situation: string;
  answers: { question: string; answer: string }[];
  expectReady: boolean;
};

export const checkReadyCases: CheckReadyCase[] = [
  // --- Should be READY immediately ---
  {
    id: 'cr-01',
    description: 'Specific factual question — ready on first answer',
    situation: 'explain',
    answers: [
      { question: "What would you like me to explain?", answer: "Who is in the Epstein files?" },
    ],
    expectReady: true,
  },
  {
    id: 'cr-02',
    description: 'Write request with clear recipient and topic',
    situation: 'write',
    answers: [
      { question: "What do you need to write?", answer: "An apology email to my boss for missing a deadline" },
    ],
    expectReady: true,
  },
  {
    id: 'cr-03',
    description: 'Recipe request is specific enough',
    situation: 'other',
    answers: [
      { question: "What can I help you with?", answer: "Give me a chocolate cake recipe" },
    ],
    expectReady: true,
  },
  {
    id: 'cr-04',
    description: 'Named topic with angle chosen — ready to generate',
    situation: 'explain',
    answers: [
      { question: "What would you like me to explain?", answer: "How does photosynthesis work?" },
      { question: "Would you like me to focus on what happens inside the plant, or why it matters for our environment?", answer: "What happens inside the plant" },
    ],
    expectReady: true,
  },
  {
    id: 'cr-05',
    description: 'Summarize with text pasted',
    situation: 'summarize',
    answers: [
      { question: "Paste a text you'd like me to summarize.", answer: "The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration involving the electron transport chain and oxidative phosphorylation." },
    ],
    expectReady: true,
  },

  // --- Should ask MORE ---
  {
    id: 'cr-06',
    description: 'Completely vague write request — no topic, no recipient',
    situation: 'write',
    answers: [
      { question: "What do you need to write?", answer: "Help me write something" },
    ],
    expectReady: false,
  },
  {
    id: 'cr-07',
    description: 'Vague recommendation with no category',
    situation: 'other',
    answers: [
      { question: "What can I help you with?", answer: "Give me some recommendations" },
    ],
    expectReady: false,
  },
];
