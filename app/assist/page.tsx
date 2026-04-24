'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { useConversations, type MessageType, type ChatMessage, type Answer } from '@/contexts/ConversationsContext';
import ConversationSidebar from './components/ConversationSidebar';
import styles from './page.module.css';

function renderInline(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={j}>{part.slice(2, -2)}</strong>
      : part
  );
}

function renderText(text: string) {
  return text.split('\n').map((line, i, arr) => {
    const headingMatch = line.match(/^#{1,3} (.+)/);
    if (headingMatch) {
      return <p key={i} style={{ fontWeight: 600, marginBottom: '0.25em' }}>{headingMatch[1]}</p>;
    }
    return (
      <span key={i}>
        {renderInline(line)}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

// ---------------------------------------------------------------------------
// Stable ID-based FAQ data (IDs match keys in messages/*.json faqItems)
// ---------------------------------------------------------------------------
const situationFaqItems: Record<string, string[]> = {
  write:     ['rewrite-concise', 'email-formal', 'birthday-note', 'rewrite-assertive'],
  explain:   ['bitcoin', 'longevity', 'epstein', 'interest-rates'],
  summarize: ['article-insights', 'summarize-email', 'book-learnings', 'news-summary'],
  translate: ['translate-spanish', 'french-basics', 'translate-en-de', 'thank-you-japanese'],
  health:    ['improve-sleep', 'cold-remedies', 'insulin-foods', 'understand-symptom'],
  image:     ['irs-letter', 'receipts', 'device-usage', 'blood-test'],
  trip:      ['chicago-restaurants', 'paris-trip', 'honeymoon', 'date-night'],
  decide:    ['savings', 'switch-jobs', 'mattress', 'trip-destinations'],
  recipe:    ['soup-winter', 'lasagna', 'low-sugar-breakfast', 'air-fryer'],
  other:     ['bitcoin', 'longevity', 'epstein', 'interest-rates'],
};

// IDs whose FAQ item needs a clarifying question before proceeding
const faqClarifyingIds = new Set([
  'rewrite-concise', 'email-formal', 'rewrite-assertive',
  'article-insights', 'summarize-email', 'book-learnings',
  'irs-letter', 'receipts', 'device-usage', 'blood-test',
]);

// IDs that require an image upload (subset of faqClarifyingIds)
const faqImageUploadIds = new Set(['irs-letter', 'receipts', 'device-usage', 'blood-test']);

function logPrompt(action: string, data: Record<string, unknown>) {
  if (data._prompt) {
    console.group(`%c[AskAway] LLM prompt — ${action}`, 'color: #6C63FF; font-weight: bold;');
    console.log(data._prompt);
    console.groupEnd();
  }
}

function AssistPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const situation = searchParams.get('situation') || 'write';
  const initialQuery = searchParams.get('query') || '';
  const initialPrefill = searchParams.get('prefill') || '';

  const { t, locale, localeReady } = useLocale();
  const {
    saveConversation,
    updateConversation,
    setActiveConversationId,
    pendingLoad,
    clearPendingLoad,
  } = useConversations();

  // Tracks the id of the conversation currently being shown (null = fresh/unsaved)
  const conversationIdRef = useRef<string | null>(null);
  // Prevents re-generating the LLM title after it has been set once
  const titleGeneratedRef = useRef(false);

  // Controls whether the conversation history sidebar is open (mobile only)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Allows re-triggering the init effect after "New conversation" is clicked
  const [resetKey, setResetKey] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef(0);
  const hasScrolledToResultRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState(initialPrefill);
  const [isTyping, setIsTyping] = useState(false);
  const [typingLabel, setTypingLabel] = useState('');

  // Question flow state
  const [currentQuestion, setCurrentQuestion] = useState<{ question: string; suggestions: string[] } | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Generated conversation title (set after first AI response)
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);

  // Result state
  const [draft, setDraft] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single unified scroll effect
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (showResult && !isTyping && lastUserMsgRef.current) {
      if (!hasScrolledToResultRef.current) {
        hasScrolledToResultRef.current = true;
        // Scroll so the last user message sits just below the container's top edge
        const msgTop = lastUserMsgRef.current.getBoundingClientRect().top;
        const containerTop = container.getBoundingClientRect().top;
        container.scrollTop = Math.max(0, container.scrollTop + msgTop - containerTop - 16);
      }
      return;
    }
    hasScrolledToResultRef.current = false;
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  }, [messages, isTyping, currentQuestion, showResult]);

  // Track if we've initialized to prevent double-running in Strict Mode
  const hasInitialized = useRef(false);
  const nextMessageId = () => {
    messageCounterRef.current += 1;
    return `msg-${Date.now()}-${messageCounterRef.current}`;
  };

  // Initialize conversation — wait for locale to hydrate from localStorage first
  useEffect(() => {
    if (!localeReady) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initConversation = async () => {
      if (initialQuery) {
        const userMsgId = nextMessageId();
        setMessages([{ id: userMsgId, type: 'user', text: initialQuery }]);

        const firstAnswer = { question: t('assist.ui.initialQuestion'), answer: initialQuery };
        const newAnswers = [firstAnswer];
        setAnswers(newAnswers);
        setQuestionNumber(1);

        setTypingLabel(t('assist.ui.thinking'));
        setIsTyping(true);

        try {
          const checkResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check-ready', situation, answers: newAnswers, locale }),
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
      const greeting = t(`assist.greetings.${situation}`) || t('assist.greetings.other');
      setMessages([{ id: nextMessageId(), type: 'assistant', text: greeting }]);

      // For "other" (general-purpose chat), the greeting IS the opening prompt —
      // skip the extra API call that would produce a near-identical second message.
      if (situation === 'other') {
        setCurrentQuestion({ question: greeting, suggestions: [] });
        setQuestionNumber(1);
        return;
      }

      setTypingLabel('');
      setIsTyping(true);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'next-question', situation, questionNumber: 1, answers: [], locale }),
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
  }, [situation, localeReady, resetKey]);

  // ── Load a saved conversation when the sidebar requests it ────────────────
  useEffect(() => {
    if (!pendingLoad) return;

    // Mark as initialised so the init effect doesn't clobber the restored state
    hasInitialized.current = true;

    setMessages(pendingLoad.messages);
    setAnswers(pendingLoad.answers);
    setDraft(pendingLoad.draft);
    setShowResult(pendingLoad.showResult);
    setQuestionNumber(pendingLoad.questionNumber);
    setCurrentQuestion(pendingLoad.currentQuestion);
    setFollowUpSuggestions(pendingLoad.followUpSuggestions);
    setTextInput('');
    setFollowUpInput('');
    setIsTyping(false);
    setTypingLabel('');
    setCopied(false);
    setUploadedImages([]);
    setImageError('');
    hasScrolledToResultRef.current = false;
    conversationIdRef.current = pendingLoad.id;
    titleGeneratedRef.current = true; // already has a title — don't regenerate

    clearPendingLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLoad]);

  // ── Auto-save to sessionStorage whenever meaningful state changes ─────────
  useEffect(() => {
    const hasUserMessage = messages.some(m => m.type === 'user');
    if (!hasUserMessage) return;

    const timer = setTimeout(() => {
      const firstUserMsg = messages.find(m => m.type === 'user');
      const rawTitle = firstUserMsg?.text?.trim() || 'Image conversation';
      const placeholderTitle = rawTitle.length > 52 ? rawTitle.slice(0, 52) + '…' : rawTitle;

      if (!conversationIdRef.current) {
        // First save — use truncated text as placeholder, then upgrade with LLM title
        const id = saveConversation({
          title: placeholderTitle,
          situationType: situation,
          locale,
          messages,
          answers,
          draft,
          showResult,
          questionNumber,
          currentQuestion,
          followUpSuggestions,
        });
        conversationIdRef.current = id;
        setActiveConversationId(id);

        // Fire-and-forget: replace placeholder with a proper LLM-generated title
        if (!titleGeneratedRef.current && firstUserMsg?.text) {
          titleGeneratedRef.current = true;
          fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'title', message: firstUserMsg.text, situation, locale }),
          })
            .then(r => r.json())
            .then(data => {
              if (data.title && conversationIdRef.current) {
                updateConversation(conversationIdRef.current, { title: data.title });
              }
            })
            .catch(() => {}); // silently keep the placeholder on error
        }
      } else {
        // Subsequent saves — patch the existing entry
        updateConversation(conversationIdRef.current, {
          messages,
          answers,
          draft,
          showResult,
          questionNumber,
          currentQuestion,
          followUpSuggestions,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, answers, draft, showResult, questionNumber, currentQuestion, followUpSuggestions]);

  // ── Start a brand-new conversation ────────────────────────────────────────
  const handleNewConversation = () => {
    conversationIdRef.current = null;
    hasInitialized.current = false;
    titleGeneratedRef.current = false;
    setActiveConversationId(null);
    setMessages([]);
    setAnswers([]);
    setDraft('');
    setShowResult(false);
    setQuestionNumber(0);
    setCurrentQuestion(null);
    setFollowUpSuggestions([]);
    setTextInput('');
    setFollowUpInput('');
    setIsTyping(false);
    setTypingLabel('');
    setCopied(false);
    setUploadedImages([]);
    setImageError('');
    hasScrolledToResultRef.current = false;
    setFaqDrawerOpen(false);
    if (situation === 'other') {
      // Already on the right URL — router.push would be a no-op, so bump
      // resetKey directly to re-fire the init effect.
      setResetKey(k => k + 1);
    } else {
      // Navigating away: the situation change in the effect deps will trigger
      // re-init automatically once the URL updates. Don't bump resetKey here
      // or it fires init with the OLD situation before the URL settles.
      router.push('/assist?situation=other');
    }
  };

  const addMessage = (type: MessageType, text: string, image?: string) => {
    setMessages((prev) => [...prev, { id: nextMessageId(), type, text, image }]);
  };

  const MAX_IMAGES = 5;

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1200;
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
            else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImageError('');
    const combined = [...uploadedImages, ...files];
    if (combined.length > MAX_IMAGES) {
      setImageError(t('assist.ui.imageUploadError', { max: MAX_IMAGES }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const compressed = await Promise.all(files.map(compressImage));
    setUploadedImages((prev) => [...prev, ...compressed]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImageError('');
  };

  const handleAnswer = async (answer: string) => {
    if (situation === 'image' && questionNumber === 1) {
      if (!uploadedImages.length && !answer.trim()) return;
    } else {
      if (!answer.trim() || !currentQuestion) return;
    }

    const trimmedAnswer = answer.trim();
    setTextInput('');

    // Generate a smart title from the first user message
    if (answers.length === 0 && trimmedAnswer) generateTitle(trimmedAnswer);

    if (situation === 'image' && uploadedImages.length && questionNumber === 1) {
      uploadedImages.forEach((img) => addMessage('user', '', img));
      if (trimmedAnswer) addMessage('user', trimmedAnswer);
    } else {
      addMessage('user', trimmedAnswer);
    }

    const newAnswers = [...answers, { question: currentQuestion?.question || '', answer: trimmedAnswer }];
    setAnswers(newAnswers);
    setCurrentQuestion(null);

    const nextQuestionNumber = questionNumber + 1;

    if (situation === 'image' && questionNumber === 1 && uploadedImages.length) {
      await generateDraft(newAnswers, uploadedImages);
      return;
    }

    if (questionNumber >= 1) {
      setTypingLabel(t('assist.ui.thinking'));
      setIsTyping(true);

      try {
        const checkResponse = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check-ready', situation, answers: newAnswers, locale }),
        });

        const checkData = await checkResponse.json();
        logPrompt('check-ready', checkData);

        if (checkData.ready) {
          await generateDraft(newAnswers);
          return;
        } else if (checkData.question) {
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

    setTypingLabel('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next-question', situation, questionNumber: nextQuestionNumber, answers: newAnswers, locale }),
      });

      const data = await response.json();
      logPrompt('next-question', data);
      setIsTyping(false);

      if (data.question) {
        setCurrentQuestion({ question: data.question, suggestions: data.suggestions || [] });
        setQuestionNumber(nextQuestionNumber);
        if (data.briefAnswer) addMessage('assistant', data.briefAnswer);
        addMessage('assistant', data.question);
      }
    } catch (error) {
      console.error('Error fetching next question:', error);
      setIsTyping(false);
      addMessage('assistant', t('assist.ui.errorGeneral'));
    }
  };

  const generateDraft = async (finalAnswers: Answer[], imageData?: string[] | null) => {
    setTypingLabel(t('assist.ui.writing'));
    setIsTyping(true);

    try {
      const requestBody: Record<string, unknown> = {
        action: 'draft',
        message: finalAnswers.map(a => `${a.question}: ${a.answer}`).join('\n'),
        situation,
        answers: finalAnswers,
        locale,
      };

      const images = imageData?.length ? imageData : uploadedImages.length ? uploadedImages : null;
      if (images) requestBody.images = images;

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
        loadFollowUpSuggestions(finalAnswers, data.draft);
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      setIsTyping(false);
      addMessage('assistant', t('assist.ui.errorGeneral'));
    }
  };

  const restartWithQuery = async (query: string) => {
    hasScrolledToResultRef.current = false;
    const newAnswers = [{ question: t('assist.ui.initialQuestion'), answer: query }];
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
    setUploadedImages([]);
    setImageError('');
    setFaqDrawerOpen(false);
    setTypingLabel(t('assist.ui.thinking'));
    setIsTyping(true);

    try {
      const checkResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-ready', situation, answers: newAnswers, locale }),
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

  // FAQ items are now ID-based; display text comes from translations
  const handleFaqClick = (id: string) => {
    const displayText = t(`assist.faqItems.${id}`);
    const hasClarifying = faqClarifyingIds.has(id);
    const clarifyingQ = hasClarifying ? t(`assist.clarifyingQuestions.${id}`) : null;

    setFaqDrawerOpen(false);

    if (!clarifyingQ) {
      const conversationStarted = messages.some((m) => m.type === 'user');
      if (canUseFaq && !conversationStarted) {
        void handleAnswer(displayText);
      } else {
        void restartWithQuery(displayText);
      }
      return;
    }

    const needsImageUpload = faqImageUploadIds.has(id);

    setTextInput('');
    setDraft('');
    setShowResult(false);
    setCopied(false);
    setFollowUpInput('');
    setFollowUpSuggestions([]);
    setIsLoadingSuggestions(false);
    setUploadedImages([]);
    setImageError('');
    setIsTyping(false);
    setTypingLabel('');

    setMessages([
      { id: nextMessageId(), type: 'user', text: displayText },
      { id: nextMessageId(), type: 'assistant', text: clarifyingQ },
    ]);
    setCurrentQuestion({ question: clarifyingQ, suggestions: [] });

    if (needsImageUpload) {
      setAnswers([{ question: 'What would you like me to do with the image?', answer: displayText }]);
      setQuestionNumber(1);
    } else {
      setAnswers([{ question: t('assist.ui.initialQuestion'), answer: displayText }]);
      setQuestionNumber(2);
    }
  };

  const generateTitle = (firstUserMessage: string) => {
    if (conversationTitle) return; // only generate once
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'title', message: firstUserMessage, locale }),
    })
      .then(r => r.json())
      .then(data => { if (data.title) setConversationTitle(data.title); })
      .catch(() => {}); // fire-and-forget, non-critical
  };

  const loadFollowUpSuggestions = async (finalAnswers: Answer[], generatedDraft: string) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'follow-ups', situation, answers: finalAnswers, currentDraft: generatedDraft, locale }),
      });

      const data = await response.json();
      logPrompt('follow-ups', data);
      if (data.followUps) setFollowUpSuggestions(data.followUps);
    } catch (error) {
      console.error('Error fetching follow-up suggestions:', error);
      setFollowUpSuggestions(['Tell me more', 'Can you give an example?']);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleFollowUpSubmit = async (questionOverride?: string) => {
    const question = questionOverride || followUpInput.trim();
    if (!question) return;

    setFollowUpInput('');
    setFollowUpSuggestions([]);

    if (draft) addMessage('assistant', draft);
    addMessage('user', question);
    setTypingLabel(t('assist.ui.thinking'));
    setIsTyping(true);
    hasScrolledToResultRef.current = false;

    const updatedAnswers = [...answers, { question: 'Follow-up', answer: question }];
    setAnswers(updatedAnswers);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refine', situation, answers: updatedAnswers, currentDraft: draft, followUpQuestion: question, locale }),
      });

      const data = await response.json();
      logPrompt('follow-up answer', data);
      setIsTyping(false);

      if (data.refined) {
        setDraft(data.refined);
        setShowResult(true);
        loadFollowUpSuggestions(updatedAnswers, data.refined);
      }
    } catch (error) {
      console.error('Error answering follow-up:', error);
      setIsTyping(false);
      addMessage('assistant', t('assist.ui.errorGeneral'));
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
    if (textInput.trim()) handleAnswer(textInput);
  };

  const faqItemIds = situationFaqItems[situation] ?? [];
  const showFaqPanel = faqItemIds.length > 0;
  const showQuestionInput = currentQuestion && !isTyping && !showResult;
  const canUseFaq = Boolean(showQuestionInput);

  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);
  const [faqSidebarVisible, setFaqSidebarVisible] = useState(false);

  const handleIdeasClick = () => {
    if (window.innerWidth <= 1024) {
      setFaqDrawerOpen(true);
    } else {
      setFaqSidebarVisible((v) => !v);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            {/* Hamburger — opens the conversation sidebar on mobile */}
            <button
              className={styles.sidebarToggle}
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Open conversation history"
            >
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sidebarToggleIcon}>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <Link href="/" className={styles.backButton}>
              {t('assist.ui.startOver')}
            </Link>
          </div>
          <Link href="/" className={styles.headerLogo}>
            ask away
          </Link>
          <div className={styles.headerRight}>
            {showFaqPanel && (
              <button
                className={`${styles.faqDrawerToggle} ${faqSidebarVisible ? styles.faqDrawerToggleActive : ''}`}
                onClick={handleIdeasClick}
                aria-label={t('assist.ui.toggleIdeas')}
              >
                {t('assist.ui.ideas')}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`${styles.mainLayout} ${showFaqPanel && faqSidebarVisible ? styles.mainLayoutWithFaq : ''}`}>
        <ConversationSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewConversation={handleNewConversation}
        />

        <div className={styles.chatContainer} ref={chatContainerRef}>
          <div className={styles.chatInner}>
            {messages.map((message, index) => {
              const isLastUserMsg =
                message.type === 'user' &&
                !messages.slice(index + 1).some((m) => m.type === 'user');
              return (
                <div
                  key={message.id}
                  ref={isLastUserMsg ? lastUserMsgRef : undefined}
                  className={`${styles.message} ${
                    message.type === 'assistant' ? styles.assistantMessage : styles.userMessage
                  }`}
                >
                  {message.image ? (
                    <img src={message.image} alt={t('assist.ui.imageAlt')} className={styles.chatImageThumb} />
                  ) : (
                    <div
                      className={`${styles.messageBubble} ${
                        message.type === 'assistant' ? styles.assistantBubble : styles.userBubble
                      }`}
                    >
                      {message.type === 'assistant' ? renderText(message.text) : message.text}
                    </div>
                  )}
                </div>
              );
            })}

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

            {/* Question input area */}
            {showQuestionInput && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.inputArea}>
                  {/* Image upload area for image situation */}
                  {situation === 'image' && questionNumber === 1 && (
                    <div
                      className={`${styles.imageUploadArea} ${isDragOver ? styles.imageUploadAreaDragOver : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files?.length) {
                          handleImageUpload({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                        }
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        className={styles.fileInput}
                        id="image-upload"
                      />
                      {imageError && <p className={styles.imageError}>{imageError}</p>}
                      {uploadedImages.length > 0 && (
                        <div className={styles.imagePreviewGrid}>
                          {uploadedImages.map((img, i) => (
                            <div key={i} className={styles.imagePreviewItem}>
                              <img src={img} alt={`${t('assist.ui.imageAlt')} ${i + 1}`} className={styles.previewImage} />
                              <button onClick={() => removeImage(i)} className={styles.removeImageButton}>✕</button>
                            </div>
                          ))}
                          {uploadedImages.length < MAX_IMAGES && (
                            <label htmlFor="image-upload" className={styles.addMoreLabel}>
                              <span>+</span>
                            </label>
                          )}
                        </div>
                      )}
                      {uploadedImages.length === 0 && (
                        <label htmlFor="image-upload" className={styles.uploadLabel}>
                          <span className={styles.uploadIcon}>📷</span>
                          <span>{t('assist.ui.uploadImages')}</span>
                          <span className={styles.uploadHint}>{t('assist.ui.uploadHint')}</span>
                        </label>
                      )}
                    </div>
                  )}
                  <textarea
                    className={`${styles.textarea} ${questionNumber === 1 && situation !== 'image' ? styles.textareaLarge : ''}`}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={
                      situation === 'image' && questionNumber === 1
                        ? t('assist.ui.imagePlaceholder')
                        : questionNumber === 1
                        ? t('assist.ui.firstPlaceholder')
                        : t('assist.ui.answerPlaceholder')
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit();
                      }
                    }}
                  />
                  <button
                    className={styles.sendButton}
                    onClick={handleTextSubmit}
                    disabled={situation === 'image' && questionNumber === 1 ? !uploadedImages.length : !textInput.trim()}
                  >
                    {t('assist.ui.send')}
                  </button>
                </div>
              </div>
            )}

            {/* Draft result */}
            {showResult && draft && !isTyping && (
              <>
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.draftResponse}>
                    <div className={styles.draftText}>{renderText(draft)}</div>
                    <div className={styles.draftFooter}>
                      <p className={styles.responseDisclaimer}>
                        {t('assist.ui.disclaimer')}
                      </p>
                      <button className={styles.copyButtonSmall} onClick={handleCopy}>
                        {copied ? t('assist.ui.copied') : t('assist.ui.copy')}
                      </button>
                    </div>
                  </div>
                </div>

                {(isLoadingSuggestions || followUpSuggestions.length > 0) && (
                  <div className={`${styles.message} ${styles.assistantMessage}`}>
                    <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                      {isLoadingSuggestions ? (
                        <span className={styles.suggestionsLoading}>{t('assist.ui.loadingSuggestions')}</span>
                      ) : (
                        <div className={styles.followUpList}>
                          <p className={styles.followUpIntro}>{t('assist.ui.followUpIntro')}</p>
                          {followUpSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              className={styles.followUpListItem}
                              onClick={() => handleFollowUpSubmit(item)}
                            >
                              • {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.inputArea}>
                    <textarea
                      className={styles.textarea}
                      value={followUpInput}
                      onChange={(e) => setFollowUpInput(e.target.value)}
                      placeholder={t('assist.ui.followUpPlaceholder')}
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
                      {t('assist.ui.send')}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {showFaqPanel && (
          <>
            {faqDrawerOpen && (
              <div
                className={styles.faqOverlay}
                onClick={() => setFaqDrawerOpen(false)}
                aria-hidden="true"
              />
            )}

            <aside
              className={`${styles.faqPanel} ${faqDrawerOpen ? styles.faqPanelOpen : ''} ${!faqSidebarVisible ? styles.faqPanelHidden : ''}`}
              aria-label={t('assist.ui.howToUseTitle')}
            >
            <div className={styles.faqPanelInner}>
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

              <div className={styles.howToUse}>
                <h2 className={styles.faqTitle}>{t('assist.ui.howToUseTitle')}</h2>
                <ul className={styles.howToUseList}>
                  <li><strong>{t('assist.tips.1bold')}</strong> {t('assist.tips.1body')}</li>
                  <li><strong>{t('assist.tips.2bold')}</strong> {t('assist.tips.2body')}</li>
                  <li><strong>{t('assist.tips.3bold')}</strong> {t('assist.tips.3body')}</li>
                </ul>
              </div>

              <h2 className={styles.faqTitle}>{t('assist.ui.exampleQuestionsTitle')}</h2>
              <p className={styles.faqDescription}>{t('assist.ui.exampleQuestionsDesc')}</p>
              <div className={styles.faqList}>
                {faqItemIds.map((id) => (
                  <button
                    key={id}
                    className={styles.faqItem}
                    onClick={() => handleFaqClick(id)}
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
                    <span className={styles.faqQuestion}>{t(`assist.faqItems.${id}`)}</span>
                  </button>
                ))}
              </div>
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
