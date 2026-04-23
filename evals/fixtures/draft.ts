// Eval cases for the "draft" action.
// Each case is scored by an LLM judge against a rubric.
// The rubric describes what a good response looks like for that specific input.

export type DraftCase = {
  id: string;
  description: string;
  message: string;
  situation: string;
  answers: { question: string; answer: string }[];
  rubric: string; // Passed to LLM judge — describes what a GOOD response looks like
};

export const draftCases: DraftCase[] = [
  {
    id: 'dr-01',
    description: 'Apology email — should be warm, clear, and professional',
    message: '',
    situation: 'write',
    answers: [
      { question: "What do you need to write?", answer: "An apology email to my boss for missing a deadline" },
      { question: "How do you want it to sound?", answer: "Professional but warm" },
    ],
    rubric: `Score 1-5. A good response:
- Is formatted as an email (greeting, body, sign-off)
- Acknowledges the missed deadline directly
- Sounds professional yet warm, not robotic
- Does NOT use bullet points for the email body itself
- Is concise (not more than 3-4 short paragraphs)
Deduct points if: it's generic, cold, overly formal, or missing a clear apology.`,
  },
  {
    id: 'dr-02',
    description: 'Explain photosynthesis — specific angle chosen (inside the plant)',
    message: '',
    situation: 'explain',
    answers: [
      { question: "What would you like me to explain?", answer: "How does photosynthesis work?" },
      { question: "Focus on what happens inside the plant, or why it matters for our environment?", answer: "What happens inside the plant" },
    ],
    rubric: `Score 1-5. A good response:
- Focuses specifically on what happens inside the plant (chloroplasts, light absorption, glucose production)
- Does NOT spend time on environmental impact (that angle was not chosen)
- Uses simple, jargon-free language anyone can understand
- Is 2-4 paragraphs or uses bullet points (•) not dashes (-)
- Includes at least one concrete detail (e.g., chlorophyll, sunlight, glucose)
Deduct points if: it's too abstract, covers the wrong angle, or uses complex scientific jargon without explanation.`,
  },
  {
    id: 'dr-03',
    description: 'Summarize a short passage — output should be noticeably shorter than input',
    message: '',
    situation: 'summarize',
    answers: [
      { question: "Paste a text you'd like me to summarize.", answer: "The mitochondria is the powerhouse of the cell. It produces ATP through a process called cellular respiration, which involves breaking down glucose in the presence of oxygen. The key stages are glycolysis, the Krebs cycle, and the electron transport chain. ATP is the energy currency used by cells to power nearly all biological functions." },
      { question: "How short should the summary be?", answer: "A few sentences" },
    ],
    rubric: `Score 1-5. A good response:
- Captures the main idea: mitochondria produce ATP (energy) through cellular respiration
- Is noticeably shorter than the original (a few sentences as requested)
- Does not introduce information not in the original text
- Uses simple language
Deduct points if: it's as long as the original, misses the main point, or adds made-up details.`,
  },
  {
    id: 'dr-04',
    description: 'Explain a current event — should be specific, not generic',
    message: '',
    situation: 'explain',
    answers: [
      { question: "What would you like me to explain?", answer: "What is Bitcoin?" },
      { question: "Curious about how it works technically, or more about whether it's a good investment?", answer: "How it works technically" },
    ],
    rubric: `Score 1-5. A good response:
- Explains the technical mechanics of Bitcoin (blockchain, decentralization, mining, or cryptographic keys)
- Does NOT focus on investment advice or price speculation
- Uses an analogy or example to make it accessible
- Is 2-4 paragraphs, in plain language
Deduct points if: it's focused on investment, too vague, or uses heavy jargon without explanation.`,
  },

  // ─── Real-world session evals (EV-001 through EV-009) ───────────────────────
  // Derived from simulated senior/non-tech-savvy user sessions.
  // Failure modes: hallucination, unused clarifying answers, vague actionability,
  // inaccurate platform-specific steps, outdated facts, circular responses.

  {
    id: 'EV-001',
    description: 'Summarize request with no article provided — model should ask for the text, not hallucinate a summary',
    message: '',
    situation: 'summarize',
    answers: [
      {
        question: "Paste a text you'd like me to summarize.",
        answer: "I saw this in the newspaper about Social Security changes. It said something about cost of living adjustments and new rules for people turning 62. I just want to know the main points.",
      },
    ],
    rubric: `Score 1-5. A good response:
- Recognizes that no article text was actually provided — only a description of remembering one
- Does NOT fabricate or infer a summary of an article that was never shared
- Asks the user to paste or type the article content in a warm, encouraging way
- Reassures the user that once they share the text, summarizing it will be easy
- Is brief and inviting, not clinical or frustrating
Deduct points if: it generates any summary content, implies it read an article, or fails to ask for the text.`,
  },

  {
    id: 'EV-002',
    description: 'Thank-you note — doctor name was provided but output still uses [Doctor\'s Name] placeholder',
    message: '',
    situation: 'write',
    answers: [
      {
        question: "What do you need to write?",
        answer: "help me write a thank you note to my doctor she really helped me feel better after my hip surgery",
      },
      {
        question: "Who is the doctor, and what do you most want to thank them for?",
        answer: "Dr. Sarah Chen at Memorial Hospital. She was very patient and kind and took time to explain everything to me.",
      },
    ],
    rubric: `Score 1-5. A good response:
- Uses "Dear Dr. Chen" — NOT "[Doctor's Name]" — since the name was provided
- Incorporates the specific details the user shared (patience, explaining things, Memorial Hospital)
- Closes with "Sign your name here" or similar plain-language cue — NOT "[Your Name]"
- Includes a brief note like "Feel free to change any words to make it sound more like you!"
- Sounds warm and personal, not like a generic template
Deduct points if: it uses bracket placeholders for information already given, ignores the specific details provided, or feels generic.`,
  },

  {
    id: 'EV-003',
    description: 'Medicare Part B premium explanation — should avoid citing specific dollar figures that may be outdated',
    message: '',
    situation: 'explain',
    answers: [
      {
        question: "What would you like me to explain?",
        answer: "I got a letter from Medicare and I am confused. It has a lot of numbers and abbreviations. What does Part B premium mean and why did it go up this year",
      },
    ],
    rubric: `Score 1-5. A good response:
- Explains what "Part B premium" means in plain language (monthly cost for doctor visit coverage)
- Does NOT cite specific dollar figures or percentages that could be outdated or incorrect
- Acknowledges that premiums change each year and the letter itself has the correct current figure
- Closes with the specific Medicare helpline: 1-800-633-4227 (or 1-800-MEDICARE)
- Is warm and reassuring for someone confused by a letter
Deduct points if: it states specific dollar amounts as fact, doesn't provide a concrete next step, or fails to acknowledge the letter has the authoritative figure.`,
  },

  {
    id: 'EV-004',
    description: 'Portland trip planning — user walks with a cane, needs accessibility detail and day-by-day structure',
    message: '',
    situation: 'other',
    answers: [
      {
        question: "What can I help you with?",
        answer: "I want to visit my grandchildren in Portland Oregon for 5 days, I will be flying from Tampa Florida, I like botanical gardens and nice quiet restaurants, I walk with a cane",
      },
    ],
    rubric: `Score 1-5. A good response:
- Acknowledges the cane/mobility consideration warmly and makes the user feel cared for
- Covers airport-to-city transportation from PDX
- Suggests 1-2 accessible hotel areas (not just neighborhoods — with accessibility in mind)
- Recommends the Rose Garden and/or Japanese Garden with an accessibility note (paved paths, benches, etc.)
- Suggests Uber/Lyft as easier alternatives to MAX light rail for someone with a cane
- Provides a loose day-by-day structure or at minimum activity pacing advice for 5 days
Deduct points if: it ignores the mobility limitation, recommends activities without accessibility notes, is under ~250 words for a 5-day trip, or gives no transportation-from-airport advice.`,
  },

  {
    id: 'EV-005',
    description: 'Download photo from email to phone — instructions must handle iPhone vs Android difference, not be generic',
    message: '',
    situation: 'explain',
    answers: [
      {
        question: "What would you like me to explain?",
        answer: "how do I download a photo from my email onto my phone I keep getting photos from my daughter and I dont know where they go after I press download",
      },
    ],
    rubric: `Score 1-5. A good response:
- Either asks what kind of phone the user has (iPhone or Android) before giving steps
- OR provides two clearly labeled parallel tracks: "If you have an iPhone..." / "If you have an Android..."
- Addresses the user's specific question: where does the photo go after downloading
- Names the correct app where photos appear (Photos app on iPhone, Gallery on Android)
- Uses reassuring language — e.g. "Once you do this once or twice, it gets much easier!"
- Steps are numbered, with one action per step
Deduct points if: steps are device-agnostic to the point of being unusable, it doesn't tell the user where the photo ends up, or it assumes a platform without checking.`,
  },

  {
    id: 'EV-006',
    description: 'Medicare vs Medicare Advantage — user is very confused and needs a concrete next step, not "evaluate and compare"',
    message: '',
    situation: 'explain',
    answers: [
      {
        question: "What would you like me to explain?",
        answer: "whats the difference between Medicare and Medicare Advantage I am turning 65 next year and I need to choose and I am very confused",
      },
    ],
    rubric: `Score 1-5. A good response:
- Opens with warmth and acknowledges that feeling confused about this is completely normal
- Clearly explains the key difference between Original Medicare and Medicare Advantage in plain language
- Does NOT close with vague guidance like "evaluate and compare your options"
- Names at least one free, specific resource: SHIP counselors, 1-800-633-4227, or medicare.gov plan finder
- Mentions the enrollment window or that timing matters
- Gives a memorable rule of thumb or decision shortcut (e.g. "if you want to keep seeing your current doctors freely, Original Medicare may be better")
Deduct points if: it ends without a concrete next step, doesn't mention a free resource, or uses insurance jargon without plain-English explanation.`,
  },

  {
    id: 'EV-007',
    description: 'Birthday card — clarifying answer said "write a card" but model produced gift ideas instead',
    message: '',
    situation: 'write',
    answers: [
      {
        question: "What do you need to write?",
        answer: "I need help with something for my sister birthday",
      },
      {
        question: "What would you like to write for her birthday?",
        answer: "She is turning 70 and I want to write her a nice card. We have been close all our lives.",
      },
    ],
    rubric: `Score 1-5. A good response:
- Produces an actual ready-to-use birthday card message — NOT gift ideas, activity suggestions, or writing tips
- Captures the warmth of a lifelong sibling relationship (close all their lives)
- Celebrates the 70th milestone specifically
- Is an appropriate card length (a few heartfelt sentences, not an essay)
- Uses a name placeholder clearly (e.g. [Sister's name]) so the user knows where to personalize
- Optionally offers to adjust tone (e.g. "Want me to make it a bit funnier, or keep it sentimental?")
Deduct points if: it produces anything other than an actual card message, ignores the "close all our lives" detail, or gives generic writing tips instead of the deliverable.`,
  },

  {
    id: 'EV-008',
    description: 'Bank fee letter — user has the letter but model just tells them to re-read it (circular, unhelpful)',
    message: '',
    situation: 'other',
    answers: [
      {
        question: "What can I help you with?",
        answer: "my bank sent me a letter saying they are going to charge me a monthly maintenance fee unless I meet certain requirements. I just want to know if I am going to get charged or not",
      },
    ],
    rubric: `Score 1-5. A good response:
- Does NOT simply tell the user to re-read the letter they already have
- Invites the user to share the relevant text from the letter so it can help interpret it
- Names 2-3 of the most common fee waiver requirements (minimum balance, direct deposit, debit card use) to help the user start thinking
- Makes the user feel capable, not overwhelmed
- Is direct about why it needs more info — e.g. "Without seeing what the letter says the requirements are, I can't tell you for certain"
Deduct points if: it restates what the user already told it, tells the user to call the bank without offering to help first, or gives no actionable path forward.`,
  },

  {
    id: 'EV-009',
    description: 'NYC trip solo senior — misses Senior MetroCard discount, accessibility gaps, and vague safety advice',
    message: '',
    situation: 'other',
    answers: [
      {
        question: "What can I help you with?",
        answer: "I have never been to New York City. I am 68 years old and going alone. how do I get around without a car and is it safe for a senior",
      },
    ],
    rubric: `Score 1-5. A good response:
- Opens with genuine, specific reassurance (not just "NYC is great!")
- Mentions the Senior Citizen Reduced-Fare MetroCard (half-price rides for ages 65+) and how to get one
- Covers taxis and Uber/Lyft as practical alternatives to the subway
- Notes that not all subway stations have elevators and suggests checking accessibility before relying on the subway
- Addresses safety in specific, practical terms — not just "avoid dark areas"
- Suggests senior-friendly, walkable areas (e.g. Midtown, Central Park area, Upper West Side)
- Closes with encouragement, not anxiety
Deduct points if: it omits the Senior MetroCard discount, gives only generic safety advice, doesn't mention elevator/accessibility limitations of the subway, or feels anxiety-inducing rather than empowering.`,
  },
];
