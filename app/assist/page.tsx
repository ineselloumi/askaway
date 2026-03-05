'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

type MessageType = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  type: MessageType;
  text: string;
}

interface Answer {
  question: string;
  answer: string;
}

const situationGreetings: Record<string, string> = {
  'write': "Hi! I'll help you write something.",
  'explain': "Hi! I'll help you understand something.",
  'summarize': "Hi! I'll help make something more concise.",
  'image': "Hi! I'll help you understand an image.",
  'translate': "Hi! I'll help you translate.",
  'health': "Hi! I'll help with health information.",
  'recipe': "Hi! I'll help you find a recipe.",
  'trip': "Hi! I'll help you plan a trip.",
  'other': "Hi! I'm here to help.",
};

const situationTitles: Record<string, string> = {
  'write': 'Write for me',
  'explain': 'Explain something',
  'summarize': 'Summarize',
  'image': 'Explain an image',
  'translate': 'Translate',
  'health': 'Health information',
  'recipe': 'Find a recipe',
  'trip': 'Plan a trip',
  'other': 'Something else',
};

const situationFaqQuestions: Record<string, string[]> = {
  write: [
    'Rewrite this to sound more concise',
    'Make my email sound more formal',
    'Help me write a birthday note to my friend',
    'Rewrite this to sound more assertive',
    'Help me write a cover letter for a job',
    'Turn my notes into a clear message',
    'Help me write a polite follow-up',
    'Make this message sound more professional',
    'Help me write a thoughtful thank-you note',
    'Help me answer this diplomatically',
  ],
  explain: [
    'What is Bitcoin and why does it matter?',
    'Explain inflation to me like I\'m 10',
    'What do we know about longevity?',
    'Why is AI advancing so quickly?',
    'What\'s happening with the Epstein files?',
    'How do interest rates affect markets?',
  ],
  summarize: [
    'Top insights in this article',
    'Summarize this email',
    'Give me the high level learnings from a book',
  ],
  translate: [
    'Translate this paragraph from Spanish',
    'What are some basic French sentences to know when visiting?',
  ],
  health: [
    'How can I improve sleep quality?',
    'What are some remedies for the common cold?',
    'Foods to avoid for people with insulin resistance',
    'Help me understand a symptom',
  ],
  image: [
    'Explain this letter from the IRS',
    'Sum up these receipts for me',
    'How should I use this device?',
    'Interpret my blood test results',
  ],
  trip: [
    'Help me find nice dinner restaurants in Chicago',
    'Plan a 3-day trip to Paris in June',
    'Affordable honeymoon ideas',
    'Date night ideas within 15 minutes of my home',
  ],
  decide: [
    'How much should I be saving each month?',
    'Should I switch jobs?',
    'What mattress brand should I buy',
  ],
  recipe: [
    'Easy soup recipes for winter',
    'I have lentils in my pantry, what meal can I cook',
    'How to make lasagna',
    'Ideas for hosting a brunch at home',
    'Low sugar breakfast ideas',
    'High protein snack ideas',
    'Avocado toast variations',
    '20 minute air fryer recipes',
    'Easy pancake recipe',
    'Dairy free mashed potato recipe',
  ],
};

// FAQ items that require the user to provide content before processing.
// Maps the FAQ query text to a personalized clarifying question.
const faqClarifyingQuestions: Record<string, string> = {
  // Write for me — queries that reference existing text to transform
  'Rewrite this to sound more concise': 'Paste the text you\'d like me to rewrite.',
  'Make my email sound more formal': 'Paste your email below.',
  'Rewrite this to sound more assertive': 'Paste the text you\'d like to rewrite.',
  'Turn my notes into a clear message': 'Paste your notes below.',
  'Make this message sound more professional': 'Paste the message you\'d like me to improve.',
  'Help me answer this diplomatically': 'Paste the message you need to respond to.',
  // Summarize — all queries need text input
  'Top insights in this article': 'Paste the article below.',
  'Summarize this email': 'Paste the email you\'d like me to summarize.',
  'Give me the high level learnings from a book': 'Which book, or paste a passage you\'d like me to summarize?',
  // Translate — only the query that needs input text
  'Translate this paragraph from Spanish': 'Paste the Spanish paragraph below.',
  // Explain an image — all queries need an image upload
  'Explain this letter from the IRS': 'Please upload the letter you\'d like me to explain.',
  'Sum up these receipts for me': 'Please upload the receipts.',
  'How should I use this device?': 'Please upload a photo of the device.',
  'Interpret my blood test results': 'Please upload your blood test results.',
};

const faqImageUploadItems = new Set([
  'Explain this letter from the IRS',
  'Sum up these receipts for me',
  'How should I use this device?',
  'Interpret my blood test results',
]);

function logPrompt(action: string, data: Record<string, unknown>) {
  if (data._prompt) {
    console.group(`%c[AskAway] LLM prompt — ${action}`, 'color: #6C63FF; font-weight: bold;');
    console.log(data._prompt);
    console.groupEnd();
  }
}

function AssistPageContent() {
  const searchParams = useSearchParams();
  const situation = searchParams.get('situation') || 'write';
  const initialQuery = searchParams.get('query') || '';
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingLabel, setTypingLabel] = useState('');

  // Question flow state
  const [currentQuestion, setCurrentQuestion] = useState<{ question: string; suggestions: string[] } | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Result state
  const [draft, setDraft] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, currentQuestion, showResult]);

  // Track if we've initialized to prevent double-running in Strict Mode
  const hasInitialized = useRef(false);
  const nextMessageId = () => {
    messageCounterRef.current += 1;
    return `msg-${Date.now()}-${messageCounterRef.current}`;
  };

  // Initialize conversation with greeting and first question
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initConversation = async () => {
      // If a pre-filled query came from the home page, skip the greeting and
      // first question — show the user's query immediately and check if we
      // have enough info to draft an answer right away.
      if (initialQuery) {
        const userMsgId = nextMessageId();
        setMessages([{ id: userMsgId, type: 'user', text: initialQuery }]);

        const firstAnswer = { question: 'What would you like help with?', answer: initialQuery };
        const newAnswers = [firstAnswer];
        setAnswers(newAnswers);
        setQuestionNumber(1);

        setTypingLabel('Thinking...');
        setIsTyping(true);

        try {
          const checkResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'check-ready',
              situation,
              answers: newAnswers,
            }),
          });

          const checkData = await checkResponse.json();
          logPrompt('check-ready', checkData);

          if (checkData.ready) {
            await generateDraft(newAnswers);
          } else if (checkData.question) {
            setIsTyping(false);
            setCurrentQuestion({ question: checkData.question, suggestions: checkData.suggestions || [] });
            setQuestionNumber(2);
            addMessage('assistant', checkData.question);
          } else {
            // Fallback: generate draft anyway
            await generateDraft(newAnswers);
          }
        } catch (error) {
          console.error('Error checking readiness for initial query:', error);
          setIsTyping(false);
          await generateDraft(newAnswers);
        }
        return;
      }

      // Normal flow: show greeting + first question
      const greeting = situationGreetings[situation] || situationGreetings['write'];
      setMessages([{ id: nextMessageId(), type: 'assistant', text: greeting }]);

      // Fetch first question
      setTypingLabel('');
      setIsTyping(true);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'next-question',
            situation,
            questionNumber: 1,
            answers: [],
          }),
        });

        const data = await response.json();
        logPrompt('next-question (Q1)', data);
        setIsTyping(false);

        if (data.question) {
          setCurrentQuestion({ question: data.question, suggestions: data.suggestions || [] });
          setQuestionNumber(1);
          setMessages(prev => [...prev, { id: nextMessageId(), type: 'assistant', text: data.question }]);
        }
      } catch (error) {
        console.error('Error fetching first question:', error);
        setIsTyping(false);
      }
    };

    initConversation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situation]);

  const addMessage = (type: MessageType, text: string) => {
    setMessages((prev) => [...prev, { id: nextMessageId(), type, text }]);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setImageFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle user answering a question (via text input or suggestion)
  const handleAnswer = async (answer: string) => {
    // For image situation, require either image or text
    if (situation === 'image' && questionNumber === 1) {
      if (!uploadedImage && !answer.trim()) return;
    } else {
      if (!answer.trim() || !currentQuestion) return;
    }

    const trimmedAnswer = answer.trim();
    setTextInput('');

    // For image uploads, show the image filename in the message
    if (situation === 'image' && uploadedImage && questionNumber === 1) {
      addMessage('user', trimmedAnswer || `[Uploaded: ${imageFileName}]`);
    } else {
      addMessage('user', trimmedAnswer);
    }

    const newAnswers = [...answers, { question: currentQuestion?.question || '', answer: trimmedAnswer }];
    setAnswers(newAnswers);
    setCurrentQuestion(null);

    const nextQuestionNumber = questionNumber + 1;

    // For image situation, generate draft immediately after first question (image + question submitted)
    if (situation === 'image' && questionNumber === 1 && uploadedImage) {
      await generateDraft(newAnswers, uploadedImage);
      return;
    }

    // After 1st answer, check if we have enough info
    if (questionNumber >= 1) {
      setTypingLabel('Thinking...');
      setIsTyping(true);

      try {
        const checkResponse = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check-ready',
            situation,
            answers: newAnswers,
          }),
        });

        const checkData = await checkResponse.json();
        logPrompt('check-ready', checkData);

        if (checkData.ready) {
          // Generate the draft
          await generateDraft(newAnswers);
          return;
        } else if (checkData.question) {
          // LLM wants to ask another question
          setIsTyping(false);
          setCurrentQuestion({ question: checkData.question, suggestions: checkData.suggestions || [] });
          setQuestionNumber(nextQuestionNumber);
          addMessage('assistant', checkData.question);
          return;
        }
      } catch (error) {
        console.error('Error checking readiness:', error);
      }
    }

    // Fetch next question
    setTypingLabel('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'next-question',
          situation,
          questionNumber: nextQuestionNumber,
          answers: newAnswers,
        }),
      });

      const data = await response.json();
      logPrompt('next-question', data);
      setIsTyping(false);

      if (data.question) {
        setCurrentQuestion({ question: data.question, suggestions: data.suggestions || [] });
        setQuestionNumber(nextQuestionNumber);

        // If there's a brief answer (user asked a question), show it first
        if (data.briefAnswer) {
          addMessage('assistant', data.briefAnswer);
        }
        addMessage('assistant', data.question);
      }
    } catch (error) {
      console.error('Error fetching next question:', error);
      setIsTyping(false);
      addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }
  };

  const generateDraft = async (finalAnswers: Answer[], imageData?: string | null) => {
    setTypingLabel('Writing your response...');
    setIsTyping(true);

    try {
      const requestBody: Record<string, unknown> = {
        action: 'draft',
        message: finalAnswers.map(a => `${a.question}: ${a.answer}`).join('\n'),
        situation,
        answers: finalAnswers,
      };

      // Include image data if available
      if (imageData || uploadedImage) {
        requestBody.image = imageData || uploadedImage;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      logPrompt('draft', data);
      setIsTyping(false);

      if (data.draft) {
        setDraft(data.draft);
        setShowResult(true);
        addMessage('assistant', "Here's what I came up with:");

        // Load follow-up suggestions
        loadFollowUpSuggestions(finalAnswers, data.draft);
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      setIsTyping(false);
      addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }
  };

  const restartWithQuery = async (query: string) => {
    const newAnswers = [{ question: 'What would you like help with?', answer: query }];
    setMessages([{ id: nextMessageId(), type: 'user', text: query }]);
    setTextInput('');
    setCurrentQuestion(null);
    setQuestionNumber(1);
    setAnswers(newAnswers);
    setDraft('');
    setShowResult(false);
    setCopied(false);
    setFollowUpInput('');
    setFollowUpSuggestions([]);
    setIsLoadingSuggestions(false);
    setUploadedImage(null);
    setImageFileName('');
    setFaqDrawerOpen(false);
    setTypingLabel('Thinking...');
    setIsTyping(true);

    try {
      const checkResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-ready', situation, answers: newAnswers }),
      });
      const checkData = await checkResponse.json();
      logPrompt('check-ready', checkData);
      if (checkData.ready) {
        await generateDraft(newAnswers, null);
      } else if (checkData.question) {
        setIsTyping(false);
        setCurrentQuestion({ question: checkData.question, suggestions: checkData.suggestions || [] });
        setQuestionNumber(2);
        addMessage('assistant', checkData.question);
      } else {
        await generateDraft(newAnswers, null);
      }
    } catch (error) {
      console.error('Error restarting conversation:', error);
      setIsTyping(false);
      await generateDraft(newAnswers, null);
    }
  };

  const handleFaqClick = (question: string) => {
    const clarifyingQ = faqClarifyingQuestions[question];
    setFaqDrawerOpen(false);

    if (!clarifyingQ) {
      // No clarification needed — use existing flow
      if (canUseFaq) {
        void handleAnswer(question);
      } else {
        void restartWithQuery(question);
      }
      return;
    }

    const needsImageUpload = faqImageUploadItems.has(question);

    // Reset all conversation state
    setTextInput('');
    setDraft('');
    setShowResult(false);
    setCopied(false);
    setFollowUpInput('');
    setFollowUpSuggestions([]);
    setIsLoadingSuggestions(false);
    setUploadedImage(null);
    setImageFileName('');
    setIsTyping(false);
    setTypingLabel('');

    // Show the FAQ item as user message + clarifying question as assistant message
    setMessages([
      { id: nextMessageId(), type: 'user', text: question },
      { id: nextMessageId(), type: 'assistant', text: clarifyingQ },
    ]);
    setCurrentQuestion({ question: clarifyingQ, suggestions: [] });

    if (needsImageUpload) {
      // Keep questionNumber = 1 so handleAnswer's image-upload logic fires correctly.
      // Pre-populate answers with the FAQ intent so the LLM knows what to do with the image.
      setAnswers([{ question: 'What would you like me to do with the image?', answer: question }]);
      setQuestionNumber(1);
    } else {
      // Q1 is pre-answered with the FAQ intent; clarifyingQ is now Q2.
      setAnswers([{ question: 'What would you like help with?', answer: question }]);
      setQuestionNumber(2);
    }
  };

  // Load follow-up suggestions based on situation
  const loadFollowUpSuggestions = async (finalAnswers: Answer[], generatedDraft: string) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'follow-ups',
          situation,
          answers: finalAnswers,
          currentDraft: generatedDraft,
        }),
      });

      const data = await response.json();
      logPrompt('follow-ups', data);
      if (data.followUps) {
        setFollowUpSuggestions(data.followUps);
      }
    } catch (error) {
      console.error('Error fetching follow-up suggestions:', error);
      // Fallback suggestions
      setFollowUpSuggestions(['Tell me more', 'Can you give an example?']);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle submitting a follow-up question (from text input or suggestion click)
  const handleFollowUpSubmit = async (questionOverride?: string) => {
    const question = questionOverride || followUpInput.trim();
    if (!question) return;

    setFollowUpInput('');
    setFollowUpSuggestions([]); // Clear suggestions while processing
    addMessage('user', question);
    setTypingLabel('Thinking...');
    setIsTyping(true);

    // Add follow-up to answers for context
    const updatedAnswers = [...answers, { question: 'Follow-up', answer: question }];
    setAnswers(updatedAnswers);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine',
          situation,
          answers: updatedAnswers,
          currentDraft: draft,
          followUpQuestion: question,
        }),
      });

      const data = await response.json();
      logPrompt('refine', data);
      setIsTyping(false);

      if (data.refined) {
        setDraft(data.refined);
        addMessage('assistant', "Here's more information:");

        // Reload suggestions for the new context
        loadFollowUpSuggestions(updatedAnswers, data.refined);
      }
    } catch (error) {
      console.error('Error answering follow-up:', error);
      setIsTyping(false);
      addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }
  };

  const handleCopy = () => {
    if (draft) {
      navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleAnswer(textInput);
    }
  };

  // Determine what to show
  const showQuestionInput = currentQuestion && !isTyping && !showResult;
  const faqQuestions = situationFaqQuestions[situation] ?? [];
  const showFaqPanel = faqQuestions.length > 0;
  const canUseFaq = Boolean(showQuestionInput);

  // Mobile FAQ drawer state
  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backButton}>
            ← Back
          </Link>
          <h1 className={styles.headerTitle}>
            {situationTitles[situation] || 'Get help'}
          </h1>
          {showFaqPanel && (
            <button
              className={styles.faqDrawerToggle}
              onClick={() => setFaqDrawerOpen(true)}
              aria-label="Show suggested questions"
            >
              💡 Ideas
            </button>
          )}
        </div>
      </header>

      <div className={styles.mainLayout}>
        <div className={styles.chatContainer}>
          <div className={styles.chatInner}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.type === 'assistant' ? styles.assistantMessage : styles.userMessage
                }`}
              >
                <div
                  className={`${styles.messageBubble} ${
                    message.type === 'assistant' ? styles.assistantBubble : styles.userBubble
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.typing}>
                  <div className={styles.typingDot} />
                  <div className={styles.typingDot} />
                  <div className={styles.typingDot} />
                  {typingLabel && <span className={styles.typingText}>{typingLabel}</span>}
                </div>
              </div>
            )}

            {/* Question input area: text input + suggestion chips */}
            {showQuestionInput && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.inputArea}>
                  {/* Image upload area for image situation */}
                  {situation === 'image' && questionNumber === 1 && (
                    <div className={styles.imageUploadArea}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        className={styles.fileInput}
                        id="image-upload"
                      />
                      {!uploadedImage ? (
                        <label htmlFor="image-upload" className={styles.uploadLabel}>
                          <span className={styles.uploadIcon}>📷</span>
                          <span>Click to upload an image</span>
                          <span className={styles.uploadHint}>or drag and drop</span>
                        </label>
                      ) : (
                        <div className={styles.imagePreview}>
                          <img src={uploadedImage} alt="Uploaded preview" className={styles.previewImage} />
                          <button onClick={removeImage} className={styles.removeImageButton}>
                            ✕ Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <textarea
                    className={`${styles.textarea} ${questionNumber === 1 && situation !== 'image' ? styles.textareaLarge : ''}`}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={
                      situation === 'image' && questionNumber === 1
                        ? "What would you like to know about this image?"
                        : questionNumber === 1
                        ? "Paste or type here..."
                        : "Type your answer..."
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit();
                      }
                    }}
                  />
                  {currentQuestion.suggestions && currentQuestion.suggestions.length > 0 && situation !== 'image' && (
                    <div className={styles.suggestionChips}>
                      {currentQuestion.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className={styles.suggestionChip}
                          onClick={() => handleAnswer(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    className={styles.sendButton}
                    onClick={handleTextSubmit}
                    disabled={situation === 'image' && questionNumber === 1 ? !uploadedImage : !textInput.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Draft result */}
            {showResult && draft && !isTyping && (
              <>
                {/* Draft bubble */}
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.draftResponse}>
                    <div className={styles.draftText}>{draft}</div>
                    <div className={styles.draftFooter}>
                      <p className={styles.responseDisclaimer}>
                        AI can make mistakes, double check important information.
                      </p>
                      <button className={styles.copyButtonSmall} onClick={handleCopy}>
                        {copied ? '✓ Copied' : 'Copy this answer'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Follow-up suggestions as a separate assistant message */}
                {(isLoadingSuggestions || followUpSuggestions.length > 0) && (
                  <div className={`${styles.message} ${styles.assistantMessage}`}>
                    <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                      {isLoadingSuggestions ? (
                        <span className={styles.suggestionsLoading}>Loading suggestions...</span>
                      ) : (
                        <div className={styles.followUpList}>
                          <p className={styles.followUpIntro}>If you want, I can answer these questions next:</p>
                          {followUpSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              className={styles.followUpListItem}
                              onClick={() => handleFollowUpSubmit(suggestion)}
                            >
                              • {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Follow-up input — same style as first question input */}
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.inputArea}>
                    <textarea
                      className={styles.textarea}
                      value={followUpInput}
                      onChange={(e) => setFollowUpInput(e.target.value)}
                      placeholder="Ask anything else..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleFollowUpSubmit();
                        }
                      }}
                    />
                    <button
                      className={styles.sendButton}
                      onClick={() => handleFollowUpSubmit()}
                      disabled={!followUpInput.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Static Start Over — always visible */}
            <div className={styles.startOverContainer}>
              <Link href="/" className={styles.startOverStatic}>
                Start over
              </Link>
            </div>

            <div ref={chatEndRef} />
          </div>
        </div>

        {showFaqPanel && (
          <>
            {/* Mobile backdrop */}
            {faqDrawerOpen && (
              <div
                className={styles.faqOverlay}
                onClick={() => setFaqDrawerOpen(false)}
                aria-hidden="true"
              />
            )}

          <aside
            className={`${styles.faqPanel} ${faqDrawerOpen ? styles.faqPanelOpen : ''}`}
            aria-label="Other people asked"
          >
            {/* Mobile drawer handle + close */}
            <div className={styles.faqDrawerHeader}>
              <div className={styles.faqDrawerHandle} />
              <button
                className={styles.faqDrawerClose}
                onClick={() => setFaqDrawerOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <h2 className={styles.faqTitle}>Other people asked</h2>
            <p className={styles.faqDescription}>Try one of these to get started.</p>
            <div className={styles.faqList}>
              {faqQuestions.map((question) => (
                <button
                  key={question}
                  className={styles.faqItem}
                  onClick={() => handleFaqClick(question)}
                >
                  <span className={styles.faqIcon} aria-hidden="true">
                    <svg
                      className={styles.faqIconSvg}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 10.5H16M8 14H13M20 11.5C20 15.6421 16.4183 19 12 19C10.8462 19 9.74944 18.7708 8.7585 18.3572L5 19.5L6.06779 16.2597C5.39703 14.9488 5 13.4724 5 11.5C5 7.35786 8.58172 4 13 4C17.4183 4 20 7.35786 20 11.5Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className={styles.faqQuestion}>{question}</span>
                </button>
              ))}
            </div>
          </aside>
          </>
        )}
      </div>
    </div>
  );
}

export default function AssistPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssistPageContent />
    </Suspense>
  );
}
