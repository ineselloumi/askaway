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

const recipeFaqQuestions = [
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
];

function AssistPageContent() {
  const searchParams = useSearchParams();
  const situation = searchParams.get('situation') || 'write';
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

    // After 2nd answer, check if we have enough info
    if (questionNumber >= 2) {
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

  // Load follow-up suggestions based on situation
  const loadFollowUpSuggestions = async (finalAnswers: Answer[], generatedDraft: string) => {
    // Static suggestions for write and summarize
    if (situation === 'write') {
      setFollowUpSuggestions(['Make it shorter', 'Make it more formal', 'Make it more friendly']);
      return;
    }

    if (situation === 'summarize') {
      setFollowUpSuggestions(['Make it shorter', 'Explain it in simpler words']);
      return;
    }

    // For "explain" and "other", fetch LLM-generated suggestions
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
  const showRecipeFaqPanel = situation === 'recipe';
  const canUseRecipeFaq = Boolean(showQuestionInput);

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
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.draftResponse}>
                  <div className={styles.draftText}>{draft}</div>

                  {/* Follow-up input */}
                  <div className={styles.followUpSection}>
                    <div className={styles.followUpLabel}>Have a follow-up question?</div>
                    <div className={styles.followUpInputArea}>
                      <textarea
                        className={styles.followUpTextarea}
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
                      {/* Suggestion chips */}
                      {isLoadingSuggestions ? (
                        <div className={styles.suggestionsLoading}>Loading suggestions...</div>
                      ) : followUpSuggestions.length > 0 && (
                        <div className={styles.followUpSuggestions}>
                          {followUpSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              className={styles.followUpSuggestionChip}
                              onClick={() => handleFollowUpSubmit(suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        className={styles.followUpSendButton}
                        onClick={() => handleFollowUpSubmit()}
                        disabled={!followUpInput.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  <p className={styles.responseDisclaimer}>
                    AI can make mistakes, double check important information.
                  </p>
                </div>

                {/* Success actions */}
                <div className={styles.success}>
                  <div className={styles.successButtons}>
                    <button className={styles.copyButton} onClick={handleCopy}>
                      {copied ? '✓ Copied!' : 'Copy to clipboard'}
                    </button>
                    <Link href="/" className={styles.startOverButton}>
                      Start over
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {showRecipeFaqPanel && (
          <aside className={styles.faqPanel} aria-label="Frequently asked questions">
            <h2 className={styles.faqTitle}>Frequently asked questions</h2>
            <p className={styles.faqDescription}>Try one of these recipe requests.</p>
            <div className={styles.faqList}>
              {recipeFaqQuestions.map((question) => (
                <button
                  key={question}
                  className={styles.faqItem}
                  onClick={() => {
                    if (!canUseRecipeFaq) return;
                    void handleAnswer(question);
                  }}
                  disabled={!canUseRecipeFaq}
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
