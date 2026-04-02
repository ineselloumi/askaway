import { NextRequest, NextResponse } from 'next/server';
import { generateMockDrafts, refineMockDraft, generateMockQuestions } from '@/lib/mockGenerator';

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } },
};

// ---------------------------------------------------------------------------
// Rate limiting — in-memory sliding window (best-effort per serverless instance)
// For production at scale, swap this for Upstash Redis rate limiting.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20;           // requests per window per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// ---------------------------------------------------------------------------
// Input limits
// ---------------------------------------------------------------------------
const MAX_MESSAGE_LENGTH    = 2_000;
const MAX_DRAFT_LENGTH      = 10_000;
const MAX_FOLLOW_UP_LENGTH  = 500;
const MAX_ANSWERS_COUNT     = 10;
const MAX_ANSWER_LENGTH     = 1_000;
const MAX_IMAGE_B64_BYTES   = 5 * 1024 * 1024; // ~3.75 MB original image

interface GenerateRequest {
  action?: 'questions' | 'draft' | 'refine' | 'next-question' | 'check-ready' | 'follow-ups';
  message: string;
  situation: string;
  answers?: { question: string; answer: string }[];
  refinement?: 'shorter' | 'kinder' | 'clearer';
  currentDraft?: string;
  questionNumber?: number;
  followUpQuestion?: string;
  image?: string; // Base64 encoded image data (single, legacy)
  images?: string[]; // Base64 encoded image data (multiple)
}

function getProvider() {
  return process.env.PROVIDER || 'anthropic';
}

function getAnthropicKey() {
  // Use custom env var name to avoid conflict with shell env
  return process.env.ASK_AWAY_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
}

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY;
}

function hasApiKey(): boolean {
  const provider = getProvider();
  const anthropicKey = getAnthropicKey();
  const openaiKey = getOpenAIKey();
  if (provider === 'anthropic' && anthropicKey) return true;
  if (provider === 'openai' && openaiKey) return true;
  return false;
}

// First questions ask for the ACTUAL CONTENT the user wants help with
function getFirstQuestion(situation: string): { question: string; suggestions: string[]; isContentQuestion: boolean } {
  const firstQuestions: Record<string, { question: string; suggestions: string[]; isContentQuestion: boolean }> = {
    'write': {
      question: "What do you need to write? Tell me who it's for and what you want to say.",
      suggestions: [],
      isContentQuestion: true,
    },
    'explain': {
      question: "Paste or describe what you'd like me to explain.",
      suggestions: [],
      isContentQuestion: true,
    },
    'summarize': {
      question: "Paste a text you'd like me to summarize. You can also paste website links directly.",
      suggestions: [],
      isContentQuestion: true,
    },
    'other': {
      question: "What can I help you with?",
      suggestions: [],
      isContentQuestion: true,
    },
  };

  return firstQuestions[situation] || firstQuestions['other'];
}

// Check if text looks like a question (ends with ? or starts with question words)
function looksLikeQuestion(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  if (trimmed.endsWith('?')) return true;
  const questionStarters = ['what', 'who', 'where', 'when', 'why', 'how', 'is ', 'are ', 'can ', 'could ', 'do ', 'does ', 'will ', 'would '];
  return questionStarters.some(starter => trimmed.startsWith(starter));
}

// Build prompt that gives a brief answer AND asks a follow-up question
function buildBriefAnswerWithQuestionPrompt(situation: string, answers: { question: string; answer: string }[]): string {
  const lastAnswer = answers[answers.length - 1];
  const userQuestion = lastAnswer?.answer || '';

  return `The user asked: "${userQuestion}"

Give a brief 1-2 sentence answer to hook their interest, then ask ONE follow-up question that's SPECIFIC to their topic.

The follow-up question should help you understand what ANGLE or ASPECT they care about most - NOT just "how detailed do you want it?"

Examples of GOOD follow-up questions:
- "What are the Epstein files?" → "Are you more curious about who was named in the files, or what crimes were alleged?"
- "How does photosynthesis work?" → "Would you like me to focus on what happens inside the plant, or why it matters for our environment?"
- "What's happening in Ukraine?" → "Are you looking for recent developments, or want to understand how the conflict started?"
- "What is Bitcoin?" → "Are you curious about how it works technically, or more about whether it's a good investment?"

Examples of BAD follow-up questions (too generic):
- "How detailed would you like the explanation?"
- "Would you like a quick overview or detailed explanation?"
- "How much do you want to know?"

Rules:
- Brief answer: 1-2 sentences MAX, just enough to show you understand the topic
- Follow-up question: Ask about a SPECIFIC angle or aspect of THEIR topic
- Suggestions: 2-3 SHORT options (3-6 words each) that represent different angles
- Use simple, accessible language that anyone can understand
- Be friendly and helpful

Respond in this exact JSON format:
{
  "briefAnswer": "Your 1-2 sentence teaser answer here.",
  "question": "Your specific follow-up question here?",
  "suggestions": ["Angle 1", "Angle 2", "Angle 3"]
}`;
}

function buildNextQuestionPrompt(situation: string, answers: { question: string; answer: string }[], questionNumber: number): string {
  const situationContext: Record<string, string> = {
    'write': 'write something (an email, letter, text message, etc.)',
    'explain': 'learn about or understand something',
    'summarize': 'summarize something to make it more concise',
    'other': 'get help with a general question or task',
  };

  const context = situationContext[situation] || situationContext['write'];
  const answersText = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

  // Different prompts based on situation
  const situationGuidance: Record<string, string> = {
    'write': `For writing help, ask about:
- The tone they want (formal, friendly, professional)
- Who the recipient is (boss, friend, customer)
- Key points they want to include`,
    'explain': `For explanations, ask about a DIFFERENT aspect than what's already been discussed.

CRITICAL: Look at the conversation above. If the user has already chosen an angle (like "who was named" vs "what crimes"), do NOT ask them to choose again!

Instead, ask something that helps you give a BETTER answer about their chosen angle:
- "Want me to focus on the most famous names, or all the people mentioned?"
- "Should I explain the timeline of events, or just the key facts?"
- "Want a quick summary or more detail?"`,
    'summarize': `For summaries, ask about:
- Desired length (few sentences, paragraph, bullet points)
- Key focus areas`,
    'other': `Ask one helpful clarifying question specific to their topic.`,
  };

  const guidance = situationGuidance[situation] || situationGuidance['other'];

  return `You are helping someone ${context}. Here's the full conversation so far:

${answersText}

${guidance}

Generate ONE simple follow-up question with 2-3 short suggested answers.

CRITICAL RULES:
- NEVER ask a question that was already asked or answered in the conversation above
- If they've already chosen between two options, DO NOT ask them to choose again
- Read their answers carefully - they tell you what they want
- Ask a NEW question that helps you give a better response
- Use simple, accessible language
- Suggestions should be short (2-5 words each)

Respond in this exact JSON format:
{
  "question": "Your question here?",
  "suggestions": ["Option 1", "Option 2", "Option 3"]
}`;
}

function buildCheckReadyPrompt(situation: string, answers: { question: string; answer: string }[]): string {
  const situationContext: Record<string, string> = {
    'write': 'write something (an email, letter, text message, etc.)',
    'explain': 'learn about or understand something',
    'summarize': 'summarize something to make it more concise',
    'other': 'get help with a general question or task',
  };

  const context = situationContext[situation] || situationContext['write'];
  const answersText = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');
  const isFirstAnswer = answers.length === 1;

  const firstAnswerGuidance = isFirstAnswer ? `
This is the user's FIRST message. Decide: is this specific enough to answer directly?

DEFAULT TO READY (ready: true) for:
- Any factual question ("Who is in the Epstein files?", "How old is X?", "When is Y?")
- Any request with a named topic, person, place, or event
- Any recipe, explanation, or summary request with a clear subject
- Anything you could give a useful answer to right now

ONLY ask for clarification (ready: false) when the request is so vague you truly cannot help:
- "Help me write something" (no topic, no recipient, no context)
- "Give me recommendations" (no category at all)
- "I need advice" (no subject whatsoever)

CRITICAL: Do NOT ask for clarification just because multiple interpretations exist. Pick the most obvious one and answer it. The user can always follow up.
` : `
This is a follow-up answer. Answer directly — do not ask more questions.
`;

  return `You are helping someone ${context}. Here's what you know so far:

${answersText}
${firstAnswerGuidance}
Respond in this exact JSON format:
{
  "ready": true
}

OR if you genuinely need more info:
{
  "ready": false,
  "question": "Your clarifying question here?",
  "suggestions": ["Option 1", "Option 2", "Option 3"]
}`;
}

function buildDraftPrompt(message: string, situation: string, answers: { question: string; answer: string }[], hasImage?: boolean): string {
  const answersText = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

  // Get the user's most recent answer to emphasize what they specifically want
  const lastAnswer = answers[answers.length - 1];
  const userFocus = lastAnswer ? `\n\nIMPORTANT: The user's most recent request was "${lastAnswer.answer}" - make sure your response directly addresses this!` : '';

  const situationInstructions: Record<string, string> = {
    'write': 'Write what they asked for based on their preferences',
    'explain': 'Explain this in simple, easy-to-understand terms. Be SPECIFIC and give concrete details, names, examples, etc.',
    'summarize': 'Summarize this concisely while keeping the key points',
    'image': 'Carefully examine the image provided and answer the user\'s question about it with specific details about what you actually see.',
    'other': 'Help them with what they asked for',
  };

  const instruction = situationInstructions[situation] || situationInstructions['write'];

  const imageNote = hasImage
    ? `The user has uploaded an image (included above). Base your answer on what you actually see in that image.\n\n`
    : `You are helping someone who shared this:\n\n"""\n${message}\n"""\n\nThey answered these questions:\n${answersText}\n`;

  const context = hasImage
    ? `The user's question about the image:\n${answersText}\n`
    : '';

  return `${imageNote}${context}${userFocus}

${instruction}. Use simple, accessible language that anyone can understand. Avoid jargon and technical terms unless necessary.

Write ONE helpful response that DIRECTLY answers what they asked for. Keep it 2-4 short paragraphs.

If you use lists, always use bullet points (•) instead of dashes (-).

Respond with just the text, no JSON or formatting.`;
}

function buildFollowUpQuestionsPrompt(situation: string, answers: { question: string; answer: string }[], draft: string): string {
  const answersText = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

  const sharedGuidelines = `Guidelines:
- Each suggestion must be phrased as a request or question directed TO you (the AI), NOT a question directed at the user
- The user will click these suggestions to send them back to you, so they must make sense as user prompts (e.g. “Help me find a bedtime routine”, “What are the benefits of X?”, “Give me an example”)
- NEVER phrase suggestions as questions addressed to the user (e.g. NEVER “Have you considered X?”, “What works best for you?”, “Do you want more details?”)
- Keep each suggestion under ~8 words when possible
- One idea per suggestion, no multi-part phrasing
- Use simple, everyday language — no jargon
- Friendly, natural tone — not formal or clinical

Respond in this exact JSON format:
{
  “followUps”: [
    “Suggestion one”,
    “Suggestion two”,
    “Suggestion three”
  ]
}`;

  if (situation === 'write') {
    return `You just wrote the following for someone:
“””
${draft}
“””

Their original request:
${answersText}

Suggest 1–3 short prompts they can click to refine this draft. Think: tone (friendlier, more formal), length (shorter, longer), structure, or polishing a specific part. If the conversation hints at something more specific, prioritize that over generic options.

${sharedGuidelines}`;
  }

  if (situation === 'explain') {
    return `You just explained something to someone who may not be familiar with the topic:
“””
${draft}
“””

Their original question:
${answersText}

Suggest 1–3 follow-ups to help them go further. Keep suggestions simple and curiosity-driven — avoid technical terms, academic phrasing, or anything that sounds like a textbook. Think: what would a curious friend ask next? E.g. “How does that work in real life?”, “Give me an everyday example”, “What should I do with this info?”.

${sharedGuidelines}`;
  }

  if (situation === 'summarize') {
    return `You just summarized something for someone:
“””
${draft}
“””

Their original request:
${answersText}

Suggest 1–3 follow-ups — e.g. making it shorter, pulling out key points, listing action items, or going deeper on a specific part. Follow what they seemed to care about most.

${sharedGuidelines}`;
  }

  if (situation === 'image') {
    return `You just answered a question about an image:
“””
${draft}
“””

Their question:
${answersText}

Suggest 1–3 things the user can click to ask YOU (the AI) next. These must be prompts the user would send TO you — NOT questions you'd ask the user.

Good examples (user asking the AI):
- “What similar products exist on the market?”
- “Tell me more about this style”
- “What should I look for when buying something like this?”
- “Where can I find something similar?”

Bad examples (AI asking the user — NEVER do this):
- “Can you provide more details?”
- “Do you have other images?”
- “What identifying marks does it have?”

${sharedGuidelines}`;
  }

  // 'other' and fallback
  return `You just helped someone with the following:

Their request:
${answersText}

Your response:
“””
${draft}
“””

Suggest 1–3 follow-up prompts that would genuinely help them go one step further. Let the conversation guide you.

${sharedGuidelines}`;
}

function buildFollowUpAnswerPrompt(situation: string, answers: { question: string; answer: string }[], previousDraft: string, followUpQuestion: string): string {
  const answersText = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

  return `You previously helped someone with this conversation:

Original conversation:
${answersText}

Your previous response:
"""
${previousDraft}
"""

They now have a follow-up question: "${followUpQuestion}"

Answer their follow-up question helpfully. Keep the same friendly, simple tone. Use simple, accessible language that anyone can understand. If you use lists, always use bullet points (•) instead of dashes (-).

Respond with just the answer text, no JSON or formatting.`;
}

function buildRefinePrompt(currentDraft: string, refinement: string): string {
  const refinementInstructions: Record<string, string> = {
    shorter: 'Make this shorter. Remove extra words. Keep the main message.',
    kinder: 'Make this kinder and warmer. Add caring language.',
    clearer: 'Make this clearer. Use simpler words.',
  };

  return `Here is a draft:
"""
${currentDraft}
"""

${refinementInstructions[refinement] || refinementInstructions['clearer']}

Write the improved version. Keep the same meaning. Use simple, accessible language.

Respond with just the improved text.`;
}

async function callAnthropic(prompt: string, imageData?: string | string[]): Promise<string> {
  // Build message content — include images as vision blocks when provided
  let messageContent: unknown = prompt;

  const imageList = Array.isArray(imageData) ? imageData : imageData ? [imageData] : [];

  if (imageList.length > 0) {
    const blocks: unknown[] = [];
    for (const img of imageList) {
      const match = img.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        const base64Data = match[2];
        blocks.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } });
      }
    }
    blocks.push({ type: 'text', text: prompt });
    messageContent = blocks;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getAnthropicKey()!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: imageList.length > 0 ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: messageContent }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Anthropic API error');
  }

  return data.content[0].text;
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getOpenAIKey()}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI API error');
  }

  return data.choices[0].message.content;
}

async function callLLM(prompt: string, imageData?: string | string[]): Promise<string> {
  if (getProvider() === 'anthropic') {
    return callAnthropic(prompt, imageData);
  } else {
    return callOpenAI(prompt); // OpenAI vision would require a separate implementation
  }
}

export async function POST(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const body: GenerateRequest = await request.json();
    const action = body.action || 'draft';

    // --- Input validation ---
    const validActions = ['questions', 'draft', 'refine', 'next-question', 'check-ready', 'follow-ups'];
    if (body.action && !validActions.includes(body.action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }
    if (body.message && body.message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Message is too long (max 2 000 characters).' }, { status: 400 });
    }
    if (body.currentDraft && body.currentDraft.length > MAX_DRAFT_LENGTH) {
      return NextResponse.json({ error: 'Draft is too long (max 10 000 characters).' }, { status: 400 });
    }
    if (body.followUpQuestion && body.followUpQuestion.length > MAX_FOLLOW_UP_LENGTH) {
      return NextResponse.json({ error: 'Follow-up question is too long (max 500 characters).' }, { status: 400 });
    }
    if (body.answers) {
      if (body.answers.length > MAX_ANSWERS_COUNT) {
        return NextResponse.json({ error: 'Too many answers provided.' }, { status: 400 });
      }
      for (const ans of body.answers) {
        if (ans.answer && ans.answer.length > MAX_ANSWER_LENGTH) {
          return NextResponse.json({ error: 'One of your answers is too long (max 1 000 characters).' }, { status: 400 });
        }
      }
    }
    if (body.image && body.image.length > MAX_IMAGE_B64_BYTES) {
      return NextResponse.json({ error: 'Image is too large. Please use an image under ~3 MB.' }, { status: 400 });
    }

    // Generate questions for a situation
    if (action === 'next-question') {
      const questionNumber = body.questionNumber || 1;
      const answers = body.answers || [];

      // First question is always the content question (hardcoded, not LLM-generated)
      if (questionNumber === 1) {
        return NextResponse.json(getFirstQuestion(body.situation));
      }

      // Check if the user's last answer was a question (especially for "explain" situations)
      const lastAnswer = answers[answers.length - 1];
      const userAskedQuestion = lastAnswer && looksLikeQuestion(lastAnswer.answer);

      // For follow-up questions, use the LLM if available
      if (!hasApiKey()) {
        // Mock fallback for follow-up questions
        const mockFollowUps: Record<string, { question: string; suggestions: string[] }[]> = {
          'write': [
            { question: 'How do you want it to sound?', suggestions: ['Warm and friendly', 'Direct and clear', 'Formal and polite'] },
            { question: 'Is there anything specific you want to include?', suggestions: ['Yes, let me add', 'No, that covers it', 'Not sure'] },
          ],
          'explain': [
            { question: 'How detailed would you like the explanation?', suggestions: ['Quick overview', 'Detailed explanation', 'Explain like I\'m 5'] },
          ],
          'summarize': [
            { question: 'How short should the summary be?', suggestions: ['A few sentences', 'A short paragraph', 'Key bullet points'] },
          ],
          'other': [
            { question: 'Can you tell me more about what you need?', suggestions: ['Yes, let me explain', 'I want general help', 'Just do your best'] },
          ],
        };
        const followUps = mockFollowUps[body.situation] || mockFollowUps['other'];
        const idx = Math.min(questionNumber - 2, followUps.length - 1);
        return NextResponse.json(followUps[Math.max(0, idx)]);
      }

      // If the user asked a question (especially in "explain" mode), give a brief answer + follow-up
      if (userAskedQuestion && (body.situation === 'explain' || body.situation === 'other')) {
        const prompt = buildBriefAnswerWithQuestionPrompt(body.situation, answers);
        const response = await callLLM(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ ...parsed, _prompt: prompt });
        }
      }

      // Use LLM to generate contextual follow-up questions
      const prompt = buildNextQuestionPrompt(body.situation, answers, questionNumber);
      const response = await callLLM(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ ...parsed, _prompt: prompt });
      }

      // Fallback
      return NextResponse.json({ question: 'Can you tell me more?', suggestions: ['Yes', 'No', 'Not sure'] });
    }

    // Check if we have enough info or need another question
    if (action === 'check-ready') {
      const answers = body.answers || [];
      const questionCount = answers.length;

      // Force generate after 4 questions
      if (questionCount >= 4) {
        return NextResponse.json({ ready: true });
      }

      if (!hasApiKey()) {
        // Mock: ready after 1 question
        return NextResponse.json({ ready: questionCount >= 1 });
      }

      const prompt = buildCheckReadyPrompt(body.situation, answers);
      const response = await callLLM(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ ...parsed, _prompt: prompt });
      }

      // Fallback: ready after 2 questions
      return NextResponse.json({ ready: questionCount >= 2 });
    }

    // Legacy: Generate all clarifying questions at once (keeping for backwards compatibility)
    if (action === 'questions') {
      return NextResponse.json(generateMockQuestions(body.situation));
    }

    // Generate follow-up questions based on the conversation
    if (action === 'follow-ups') {
      const answers = body.answers || [];
      const draft = body.currentDraft || '';

      if (!hasApiKey()) {
        // Mock fallback
        const mockFollowUps: Record<string, string[]> = {
          'write': [
            'Can you make it more formal?',
            'What if I want to add more details?',
            'How do I make it shorter?',
          ],
          'explain': [
            'Can you explain that in simpler terms?',
            'What are the most important parts?',
            'Can you give me an example?',
          ],
          'summarize': [
            'Can you make it even shorter?',
            'What are the key takeaways?',
            'Is there anything important I might have missed?',
          ],
          'other': [
            'Can you tell me more?',
            'What should I do next?',
            'Is there anything else I should know?',
          ],
        };
        return NextResponse.json({ followUps: mockFollowUps[body.situation] || mockFollowUps['other'] });
      }

      const prompt = buildFollowUpQuestionsPrompt(body.situation, answers, draft);
      const response = await callLLM(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ ...parsed, _prompt: prompt });
      }

      // Fallback
      return NextResponse.json({ followUps: ['Can you tell me more?', 'What does this mean?', 'What should I do next?'] });
    }

    // Answer a follow-up question
    if (action === 'refine' && body.followUpQuestion) {
      const answers = body.answers || [];
      const previousDraft = body.currentDraft || '';

      if (!hasApiKey()) {
        return NextResponse.json({
          refined: 'I\'d be happy to help with that! Based on what we discussed, here\'s some more information that might be helpful...',
          isFollowUp: true
        });
      }

      const prompt = buildFollowUpAnswerPrompt(body.situation, answers, previousDraft, body.followUpQuestion);
      const response = await callLLM(prompt);
      return NextResponse.json({ refined: response.trim(), isFollowUp: true, _prompt: prompt });
    }

    // Refine existing draft
    if (action === 'refine' && body.currentDraft && body.refinement) {
      if (!hasApiKey()) {
        const result = refineMockDraft({
          currentDraft: body.currentDraft,
          refinement: body.refinement,
        });
        return NextResponse.json(result);
      }

      const prompt = buildRefinePrompt(body.currentDraft, body.refinement);
      const refined = await callLLM(prompt);
      return NextResponse.json({ refined: refined.trim() });
    }

    // Generate draft based on answers
    if (action === 'draft') {
      if (!hasApiKey()) {
        const result = generateMockDrafts({
          message: body.message,
          situation: body.situation,
          answers: body.answers || [],
        });
        return NextResponse.json(result);
      }

      const imageData = body.images ?? (body.image ? [body.image] : undefined);
      const prompt = buildDraftPrompt(body.message, body.situation, body.answers || [], !!(imageData?.length));
      const draft = await callLLM(prompt, imageData);
      return NextResponse.json({ draft: draft.trim(), _prompt: prompt });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
