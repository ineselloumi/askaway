// Eval cases for the "next-question" action.
// Tests that follow-up questions are:
//   1. Not repetitive (never re-asking something already answered)
//   2. Specific to the topic (not generic like "how much detail do you want?")
//   3. Have short, distinct suggestions (2-5 words each)

export type NextQuestionCase = {
  id: string;
  description: string;
  situation: string;
  answers: { question: string; answer: string }[];
  questionNumber: number;
  rubric: string;
  // Optional: words that must NOT appear in the generated question (repetition check)
  forbiddenTopics?: string[];
};

export const nextQuestionCases: NextQuestionCase[] = [
  {
    id: 'nq-01',
    description: 'Second question for "explain photosynthesis" — should not re-ask about angle already chosen',
    situation: 'explain',
    answers: [
      { question: "What would you like me to explain?", answer: "How does photosynthesis work?" },
      { question: "Would you like me to focus on what happens inside the plant, or why it matters for our environment?", answer: "What happens inside the plant" },
    ],
    questionNumber: 3,
    forbiddenTopics: ['environment', 'inside the plant', 'focus on'],
    rubric: `Score 1-5. A good follow-up question:
- Does NOT re-ask the user to choose between "inside the plant" vs "environment" (already chosen)
- Asks something NEW that helps give a better answer about plant internals
  e.g. level of detail, specific stage of interest, whether to use an analogy
- Suggestions are short (2-5 words each) and meaningfully different from each other
- Is not a generic "how detailed do you want it?" question
Deduct points if: it repeats a topic already resolved, or is too vague to help generate a better response.`,
  },
  {
    id: 'nq-02',
    description: 'Second question for writing an apology email — should ask about tone or key points',
    situation: 'write',
    answers: [
      { question: "What do you need to write?", answer: "An apology email to my boss for missing a deadline" },
      { question: "How do you want it to sound?", answer: "Professional but warm" },
    ],
    questionNumber: 3,
    forbiddenTopics: ['tone', 'sound', 'formal', 'warm'],
    rubric: `Score 1-5. A good follow-up question:
- Does NOT re-ask about tone (already answered: professional but warm)
- Asks about something new — e.g. specific details to include, whether to mention a reason, next steps to offer
- Suggestions are short (2-5 words each) and concrete
Deduct points if: it re-asks about tone/formality, or is too abstract to be useful.`,
  },
  {
    id: 'nq-03',
    description: 'First LLM-generated question for "explain" — should be topic-specific, not generic',
    situation: 'explain',
    answers: [
      { question: "What would you like me to explain?", answer: "What is quantum entanglement?" },
    ],
    questionNumber: 2,
    rubric: `Score 1-5. A good follow-up question:
- Is SPECIFIC to quantum entanglement (not a generic "how much detail?" question)
- Asks about a distinct angle e.g. the physics vs. real-world applications, or a specific aspect
- Suggestions are short (2-5 words) and clearly different from each other
Deduct points if: it's a generic detail/length question, or suggestions are repetitive.`,
  },
  {
    id: 'nq-04',
    description: 'Suggestions should be short — max 6 words each',
    situation: 'write',
    answers: [
      { question: "What do you need to write?", answer: "A thank-you note to my team after a successful product launch" },
    ],
    questionNumber: 2,
    rubric: `Score 1-5. A good follow-up question:
- Each suggestion is 6 words or fewer
- Suggestions are meaningfully different from each other (not just synonyms)
- The question itself is relevant to writing a team thank-you note
Deduct points if: any suggestion exceeds 6 words, or suggestions feel like they mean the same thing.`,
  },

  // ─── Real-world failure modes ────────────────────────────────────────────────
  // Three categories of observed failures:
  //   A. Irrelevant / generic questions (e.g. "how much detail?" regardless of topic)
  //   B. Too-precise / jargon-heavy questions (medical/insurance terms for a senior)
  //   C. Suggestions that break as standalone queries when clicked
  //
  // KEY RULE: suggestions must work as complete query phrases on their own.
  // When a user clicks a suggestion it is sent directly as a new message to the LLM.
  // One-word labels ("Formal"), binary answers ("Yes"/"No"), and
  // incomplete phrases ("All of it") all fail this requirement.

  // --- A. Irrelevant / generic questions ---

  {
    id: 'nq-05',
    description: 'Ibuprofen safety — should NOT ask a generic "how much detail?" question',
    situation: 'explain',
    answers: [
      {
        question: "What would you like me to explain?",
        answer: "Is it safe to take ibuprofen every day? I have arthritis and it is the only thing that helps",
      },
    ],
    questionNumber: 2,
    forbiddenTopics: ['how much detail', 'level of detail', 'how detailed', 'simple or technical'],
    rubric: `Score 1-5. A good follow-up question:
- Is SPECIFIC to ibuprofen/arthritis — asks something that will meaningfully change the answer
  e.g. "Are you more worried about the risks, or looking for alternatives to try?"
- Does NOT ask a generic detail/length question ("How much detail do you want?")
- Suggestions are complete, usable phrases — not one-word options like "Risks" or "Yes"
  e.g. "Tell me about the risks" / "Suggest some alternatives" / "Both risks and alternatives"
- Captures the emotional weight — user is worried ("only thing that helps")
Deduct points if: question is generic ("how much detail?"), suggestions are one-word labels, or the question ignores the user's evident concern.`,
  },

  {
    id: 'nq-06',
    description: 'Chicken dinner recipe — should NOT ask about irrelevant specifics like measurement system',
    situation: 'other',
    answers: [
      {
        question: "What can I help you with?",
        answer: "What can I make for dinner with chicken, rice, and frozen peas? Nothing too complicated",
      },
    ],
    questionNumber: 2,
    forbiddenTopics: ['metric', 'imperial', 'cups or grams', 'measurements', 'how many servings', 'how many people'],
    rubric: `Score 1-5. A good follow-up question:
- Asks something that meaningfully changes which recipe is recommended
  e.g. "Do you have any other ingredients handy?" or "How much time do you have to cook?"
- Does NOT ask about irrelevant technical details (measurement units, exact serving count)
- Does NOT ask things the user already answered ("Nothing too complicated" = keep it simple)
- Suggestions are complete phrases that work as standalone queries
  e.g. "I have about 30 minutes" / "I also have some onions and garlic" / "Keep it as simple as possible"
Deduct points if: question asks about measurement systems, re-asks for simplicity already stated, or suggestions are one-word ("Easy", "Quick").`,
  },

  {
    id: 'nq-07',
    description: 'NYC trip planning — question should be practically useful, not trivially obvious or invasive',
    situation: 'other',
    answers: [
      {
        question: "What can I help you with?",
        answer: "I have never been to New York City. I am 68 years old and going alone for a week. How do I get around and is it safe?",
      },
    ],
    questionNumber: 2,
    forbiddenTopics: ['budget', 'how much money', 'income', 'afford'],
    rubric: `Score 1-5. A good follow-up question:
- Asks something practical that shapes the advice — e.g. mobility needs, neighborhood preference, interests
- Does NOT ask invasive financial questions ("What is your budget?") without context
- Does NOT ask something trivially obvious given the user already mentioned age and going alone
- Suggestions read as complete, natural phrases
  e.g. "I have no trouble walking long distances" / "I use a cane or walker" / "Tell me about both getting around and safety"
Deduct points if: it asks a financial question without prompting, ignores the age/solo context already given, or suggestions are incomplete phrases.`,
  },

  // --- B. Too-precise / jargon-heavy questions ---

  {
    id: 'nq-08',
    description: 'Medicare vs Medicare Advantage — should NOT ask about plan subtypes (HMO/PPO) without explaining them',
    situation: 'explain',
    answers: [
      {
        question: "What would you like me to explain?",
        answer: "whats the difference between Medicare and Medicare Advantage I am turning 65 next year and I need to choose and I am very confused",
      },
    ],
    questionNumber: 2,
    forbiddenTopics: ['HMO', 'PPO', 'PFFS', 'SNP', 'plan type', 'Part C'],
    rubric: `Score 1-5. A good follow-up question:
- Uses plain, jargon-free language a 65-year-old unfamiliar with insurance can understand
- Does NOT introduce acronyms (HMO, PPO, PFFS) or insider terms without explaining them
- Asks something that will help personalize the answer — e.g. whether they have existing doctors they want to keep, or if they want extra benefits
- Suggestions are complete, natural phrases
  e.g. "Help me decide which one is right for me" / "Just explain the key differences" / "I have doctors I want to keep seeing"
Deduct points if: it uses insurance jargon without explanation, is too abstract to act on, or suggestions are one-word labels ("HMO", "PPO").`,
  },

  {
    id: 'nq-09',
    description: 'Inflammation explanation — should NOT ask about specific biomarkers or medical subtypes',
    situation: 'explain',
    answers: [
      {
        question: "What would you like me to explain?",
        answer: "What is inflammation and why does my doctor keep mentioning it?",
      },
    ],
    questionNumber: 2,
    forbiddenTopics: ['biomarker', 'CRP', 'cytokine', 'acute vs chronic', 'systemic', 'marker'],
    rubric: `Score 1-5. A good follow-up question:
- Stays at the right level for someone who doesn't know what inflammation is
- Does NOT ask the user to choose between medical subtypes they've never heard of
- Asks something that helps focus the explanation — e.g. "what causes it" vs "what it does to your body" vs "how to reduce it"
- Suggestions are complete, plain-language phrases
  e.g. "Explain what causes it and how to reduce it" / "Focus on why it causes disease" / "Give me a simple overview of all of it"
Deduct points if: it introduces medical jargon ("acute vs chronic", biomarkers), or suggestions are incomplete phrases the user couldn't speak aloud naturally.`,
  },

  // --- C. Suggestions that break as standalone queries when clicked ---

  {
    id: 'nq-10',
    description: 'Birthday card for sister — suggestions must be complete phrases, not one-word tone labels',
    situation: 'write',
    answers: [
      {
        question: "What do you need to write?",
        answer: "a birthday card for my sister she is turning 70",
      },
    ],
    questionNumber: 2,
    rubric: `Score 1-5. A good follow-up question:
- Asks something that shapes the card's content or tone in a meaningful way
- Suggestions are COMPLETE PHRASES that work as standalone queries when sent to the LLM
  GOOD: "Make it warm and sentimental" / "Keep it short and sweet" / "Add a little humor"
  BAD: "Formal" / "Casual" / "Funny" — these are adjectives, not usable queries
- Suggestions are meaningfully different from each other (not just synonyms)
- Does NOT ask binary yes/no questions ("Should I include a poem? Yes / No")
Deduct points if: any suggestion is a single word or adjective that couldn't stand alone as a message, suggestions are binary, or they all mean roughly the same thing.`,
  },

  {
    id: 'nq-11',
    description: 'Thank-you note to doctor — third question must not re-ask tone already given, suggestions must be full phrases',
    situation: 'write',
    answers: [
      {
        question: "What do you need to write?",
        answer: "A thank you note for my doctor Dr. Sarah Chen she helped me through my hip surgery",
      },
      {
        question: "How would you like it to sound?",
        answer: "Warm and personal, not too formal",
      },
    ],
    questionNumber: 3,
    forbiddenTopics: ['tone', 'warm', 'personal', 'formal', 'sound like'],
    rubric: `Score 1-5. A good follow-up question:
- Does NOT re-ask about tone (already answered: warm and personal, not too formal)
- Asks about something new that adds content value — e.g. a specific thing to thank her for, whether to mention the surgery, length preference
- Suggestions are COMPLETE PHRASES usable as standalone queries
  GOOD: "Mention how much she helped me recover" / "Keep it short, just a few sentences" / "Include that she always made time to explain things"
  BAD: "Yes" / "Short" / "All of the above"
- Suggestions are clearly distinct from each other
Deduct points if: it re-asks about tone/formality, suggestions are one-word answers, or they can't stand alone as messages.`,
  },

  {
    id: 'nq-12',
    description: 'Download photo from email — should ask what device the user has before giving steps, not ask about preferences',
    situation: 'explain',
    answers: [
      {
        question: "What would you like me to explain?",
        answer: "how do I download a photo from my email onto my phone I keep getting photos from my daughter and I dont know where they go",
      },
    ],
    questionNumber: 2,
    rubric: `Score 1-5. A good follow-up question:
- Asks about the user's device type (iPhone vs Android) or email app — this is the critical missing info
- Does NOT ask generic questions like "How detailed do you want the steps?" or "Are you comfortable with technology?"
- Is phrased gently — the user has signaled they are not very tech-savvy
- Suggestions are complete, conversational phrases that work as standalone queries
  GOOD: "I have an iPhone" / "I have an Android phone" / "I'm not sure what kind of phone I have"
  BAD: "iPhone" / "Android" / "Yes" — incomplete when clicked alone
Deduct points if: it doesn't ask about device type, asks something that won't change the instructions, or suggestions are single-word labels that don't read naturally as a message.`,
  },

  {
    id: 'nq-13',
    description: 'Bank fee letter — should invite user to share the letter, not ask vague financial questions',
    situation: 'other',
    answers: [
      {
        question: "What can I help you with?",
        answer: "my bank sent me a letter saying I might get charged a monthly maintenance fee unless I meet certain requirements. I want to understand it",
      },
    ],
    questionNumber: 2,
    forbiddenTopics: ['income', 'salary', 'how much money', 'afford', 'financial situation'],
    rubric: `Score 1-5. A good follow-up question:
- Focuses on getting the letter's content — asking the user to share what requirements the letter mentions
- Does NOT ask invasive personal finance questions (income, savings, etc.)
- Does NOT pretend to know what the requirements are without seeing the letter
- Suggestions are complete phrases that work as standalone queries
  GOOD: "Here is what the letter says: [they can type it]" / "It mentions a minimum balance requirement" / "I can type out what it says"
  BAD: "Yes" / "No" / "Balance" — too short and incomplete
Deduct points if: it asks personal financial questions, makes up requirements, or suggestions are incomplete phrases that don't stand alone.`,
  },
];
