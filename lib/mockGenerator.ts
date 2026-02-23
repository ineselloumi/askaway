/**
 * Mock generator for when no API key is available.
 * Returns deterministic, realistic responses so the app works out of the box.
 */

interface Question {
  question: string;
  options: string[];
}

interface GenerateParams {
  message: string;
  situation: string;
  answers: { question: string; answer: string }[];
}

interface RefineParams {
  currentDraft: string;
  refinement: 'shorter' | 'kinder' | 'clearer';
}

const mockQuestionsBySituation: Record<string, Question[]> = {
  'write': [
    {
      question: 'What are you writing?',
      options: ['An email', 'A letter', 'A text message', 'Something else'],
    },
    {
      question: 'Who is this for?',
      options: ['A friend or family', 'Someone at work', 'A company', 'Someone I don\'t know'],
    },
    {
      question: 'How do you want it to sound?',
      options: ['Warm and friendly', 'Direct and clear', 'Formal and polite'],
    },
  ],
  'explain': [
    {
      question: 'What would you like explained?',
      options: ['A document or letter', 'A topic or concept', 'A news article', 'Something else'],
    },
    {
      question: 'How detailed should the explanation be?',
      options: ['Quick overview', 'Detailed explanation', 'Step by step'],
    },
  ],
  'summarize': [
    {
      question: 'What are you summarizing?',
      options: ['A document', 'An article', 'An email or message', 'Something else'],
    },
    {
      question: 'How short should the summary be?',
      options: ['A few sentences', 'A short paragraph', 'Key bullet points'],
    },
  ],
  'other': [
    {
      question: 'What kind of help do you need?',
      options: ['Answer a question', 'Give me advice', 'Help me decide', 'Something else'],
    },
  ],
};

const mockDraftsByAnswer: Record<string, string> = {
  'Say yes': `Thank you so much for reaching out! I would be happy to help with this.

I really appreciate you thinking of me, and I look forward to working together on this.

Please let me know if you need anything else from me!`,

  'Say no politely': `Thank you for thinking of me! I really appreciate you reaching out.

Unfortunately, I am not able to do this right now. I hope you understand.

I wish you all the best, and please feel free to reach out again in the future!`,

  'Ask a question': `Thanks for your message! I want to make sure I understand correctly before I respond.

Could you tell me a bit more about what you have in mind? That would really help me give you a better answer.

Looking forward to hearing from you!`,

  'Say thank you': `I just wanted to reach out and say thank you! What you did really meant a lot to me.

I truly appreciate your kindness and thoughtfulness. It made a real difference.

Thank you again from the bottom of my heart!`,

  'default': `Thank you for your message! I have received it and wanted to respond.

I appreciate you reaching out, and I will do my best to help with this.

Please let me know if you have any questions!`,
};

export function generateMockQuestions(situation: string) {
  const questions = mockQuestionsBySituation[situation] || mockQuestionsBySituation['write'];
  return { questions };
}

export function generateMockDrafts(params: GenerateParams) {
  const { answers } = params;

  // Find a matching answer to determine the draft
  let draft = mockDraftsByAnswer['default'];

  for (const answer of answers) {
    if (mockDraftsByAnswer[answer.answer]) {
      draft = mockDraftsByAnswer[answer.answer];
      break;
    }
  }

  return { draft };
}

export function refineMockDraft(params: RefineParams) {
  const { currentDraft, refinement } = params;

  if (refinement === 'shorter') {
    // Take first sentence of each paragraph
    const paragraphs = currentDraft.split('\n\n');
    const shortened = paragraphs
      .map((p) => {
        const sentences = p.split(/(?<=[.!?])\s+/);
        return sentences[0];
      })
      .join('\n\n');
    return { refined: shortened };
  }

  if (refinement === 'kinder') {
    return {
      refined: currentDraft + '\n\nI really appreciate you, and please know that I am always here if you need anything!',
    };
  }

  if (refinement === 'clearer') {
    return {
      refined: 'In short: ' + currentDraft.split('\n\n')[0].toLowerCase() + '\n\n' + currentDraft,
    };
  }

  return { refined: currentDraft };
}
