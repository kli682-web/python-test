import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CHAT_ERROR_MESSAGE,
  CHAT_STORAGE_KEY,
  DEFAULT_CHAT_TITLE,
  DEFAULT_WELCOME_MESSAGE,
} from '../constants/chat.js';
import {
  parseStoredTimestamp,
} from '../utils/date.js';
import {
  requestChatResponse,
  requestConversationTitle,
} from '../services/chatApi.js';

// Create stable local ids for chat sessions and messages.
// 为聊天会话和消息创建稳定的本地 id。
const createId = () => crypto.randomUUID();

const normalizeMessage = (message) => ({
  id: message.id ?? createId(),
  role: message.role ?? (message.type === 'ai' ? 'model' : 'user'),
  content:
    typeof message.content === 'string'
      ? message.content
      : message.replyText ?? message.text ?? '',
  timestamp: message.timestamp ?? parseStoredTimestamp(message.time),
  image: message.image,
  recommendation: message.recommendation,
  structuredContent: message.structuredContent ?? null,
});

const normalizeSession = (session) => ({
  id: session.id ?? createId(),
  title: session.title ?? DEFAULT_CHAT_TITLE,
  sourceKey: session.sourceKey ?? null,
  updatedAt: session.updatedAt ?? Date.now(),
  messages: Array.isArray(session.messages)
    ? session.messages.map(normalizeMessage)
    : [],
});

// Treat empty untitled chats as disposable drafts so they do not pile up in the sidebar.
// 将没有内容且未命名的聊天视为可丢弃草稿，避免它们堆积在侧边栏。
const isEmptyDraftSession = (session) =>
  Boolean(session) &&
  (session.title ?? DEFAULT_CHAT_TITLE) === DEFAULT_CHAT_TITLE &&
  !session.sourceKey &&
  (!Array.isArray(session.messages) || session.messages.length === 0);

const createDefaultSessions = () => [];

const createSearchSession = (searchContext, sourceKey) =>
  normalizeSession({
    id: createId(),
    title: `${searchContext.cuisine} under $${searchContext.budget}`,
    sourceKey,
    updatedAt: Date.now(),
    messages: [
      {
        id: createId(),
        role: 'user',
        content: `I have $${searchContext.budget} and I'm craving some ${searchContext.cuisine} within a ${searchContext.distance} min walk. What do you recommend?`,
        timestamp: Date.now(),
      },
      {
        id: createId(),
        role: 'model',
        content: `Got it! Let me check the best ${searchContext.cuisine} options under $${searchContext.budget} near you...`,
        timestamp: Date.now(),
      },
    ],
  });

const createDraftSession = (overrides = {}) => ({
  id: overrides.id ?? createId(),
  title: DEFAULT_CHAT_TITLE,
  sourceKey: null,
  updatedAt: Date.now(),
  messages: [],
  ...overrides,
});

const loadInitialSessions = () => {
  const savedSessions = localStorage.getItem(CHAT_STORAGE_KEY);

  if (!savedSessions) {
    return createDefaultSessions();
  }

  try {
    const parsedSessions = JSON.parse(savedSessions);

    if (!Array.isArray(parsedSessions) || parsedSessions.length === 0) {
      return createDefaultSessions();
    }

    const normalizedSessions = parsedSessions.map(normalizeSession);
    const persistedSessions = normalizedSessions.filter(
      (session) => !isEmptyDraftSession(session)
    );

    return persistedSessions.length > 0
      ? persistedSessions
      : createDefaultSessions();
  } catch (error) {
    console.error('Failed to parse chat sessions', error);
    return createDefaultSessions();
  }
};

const buildUpdatedSession = (session, messages, overrides = {}) => ({
  ...session,
  ...overrides,
  messages,
  updatedAt: Date.now(),
});

export const useChatPage = (searchContext) => {
  const initialSessionsRef = useRef(null);
  const appliedSearchRef = useRef(null);
  const scrollRef = useRef(null);
  const emptyMessagesRef = useRef([]);

  if (!initialSessionsRef.current) {
    initialSessionsRef.current = loadInitialSessions();
  }

  const [inputValue, setInputValue] = useState('');
  const [sessions, setSessions] = useState(initialSessionsRef.current);
  const [activeSessionId, setActiveSessionId] = useState(
    initialSessionsRef.current[0]?.id ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [pendingReply, setPendingReply] = useState(null);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) || null;
  const currentMessages = useMemo(
    () => activeSession?.messages ?? emptyMessagesRef.current,
    [activeSession]
  );

  useEffect(() => {
    const persistedSessions = sessions.filter(
      (session) => !isEmptyDraftSession(session)
    );
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(persistedSessions));
  }, [sessions]);

  useEffect(() => {
    if (!searchContext) return;

    const searchKey = JSON.stringify(searchContext);
    if (appliedSearchRef.current === searchKey) return;
    appliedSearchRef.current = searchKey;

    setSessions((previousSessions) => {
      const existingSession = previousSessions.find(
        (session) => session.sourceKey === searchKey
      );

      if (existingSession) {
        setActiveSessionId(existingSession.id);
        return previousSessions;
      }

      const searchSession = createSearchSession(searchContext, searchKey);
      setActiveSessionId(searchSession.id);

      return [
        searchSession,
        ...previousSessions.filter((session) => session.id !== searchSession.id),
      ];
    });
  }, [searchContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, pendingReply]);

  const updateSessionMessages = (sessionId, nextMessages, overrides = {}) => {
    setSessions((previousSessions) => {
      const session =
        previousSessions.find((item) => item.id === sessionId) ||
        createDraftSession({ id: sessionId });
      const nextSession = buildUpdatedSession(session, nextMessages, overrides);

      return [
        nextSession,
        ...previousSessions.filter(
          (item) =>
            item.id !== nextSession.id &&
            !isEmptyDraftSession(item)
        ),
      ];
    });
  };

  const generateTitle = async (messages, fallbackTitle) => {
    try {
      const data = await requestConversationTitle(messages);
      return data.title || fallbackTitle;
    } catch (error) {
      console.error('Title generation failed', error);
      return fallbackTitle;
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage = {
      id: createId(),
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };

    const baseSession = activeSession || createDraftSession();
    const targetSessionId = activeSession?.id ?? baseSession.id;
    const nextMessages = [...(baseSession.messages ?? []), userMessage];

    setInputValue('');
    setActiveSessionId(targetSessionId);
    updateSessionMessages(targetSessionId, nextMessages, {
      title: baseSession.title ?? DEFAULT_CHAT_TITLE,
    });

    setIsLoading(true);
    setPendingReply({
      userMessageId: userMessage.id,
      startedAt: Date.now(),
      stage: 'parsing',
    });

    try {
      const response = await requestChatResponse(nextMessages);

      if (!response.ok) {
        let errorMessage = 'Failed to get response';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const message = await response.text();
          errorMessage = message || errorMessage;
        }

        throw new Error(errorMessage);
      }

      setPendingReply((current) =>
        current ? { ...current, stage: 'retrieval' } : null
      );

      const data = await response.json();

      setPendingReply((current) =>
        current ? { ...current, stage: 'generation' } : null
      );
      const modelMessageId = createId();
      const modelContent = data.reply_text || data.follow_up_question || '';

      setPendingReply(null);

      updateSessionMessages(targetSessionId, [
        ...nextMessages,
        {
          id: modelMessageId,
          role: 'model',
          content: modelContent,
          structuredContent: data,
          timestamp: Date.now(),
        },
      ]);

      const sessionNeedsGeneratedTitle =
        (baseSession.title ?? DEFAULT_CHAT_TITLE) === DEFAULT_CHAT_TITLE &&
        nextMessages.length === 1;

      if (sessionNeedsGeneratedTitle && modelContent.trim()) {
        const newTitle = await generateTitle(nextMessages, DEFAULT_CHAT_TITLE);
        updateSessionMessages(
          targetSessionId,
          [
            ...nextMessages,
            {
              id: modelMessageId,
              role: 'model',
              content: modelContent,
              structuredContent: data,
              timestamp: Date.now(),
            },
          ],
          { title: newTitle }
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setPendingReply(null);

      updateSessionMessages(targetSessionId, [
        ...nextMessages,
        {
          id: createId(),
          role: 'model',
          content: CHAT_ERROR_MESSAGE,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setPendingReply(null);
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    // Start a fresh draft without inserting an empty chat into the sidebar.
    // 开启新的草稿聊天时，不要先往侧边栏插入空会话。
    setSessions((previousSessions) =>
      previousSessions.filter((session) => !isEmptyDraftSession(session))
    );
    setActiveSessionId(null);
    setInputValue('');
    setPendingReply(null);
    setIsLoading(false);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions((previousSessions) => {
      const nextSessions = previousSessions.filter(
        (session) => session.id !== sessionId
      );

      if (activeSessionId === sessionId) {
        setActiveSessionId(nextSessions[0]?.id ?? null);
        setInputValue('');
        setPendingReply(null);
        setIsLoading(false);
      }

      return nextSessions;
    });
  };

  const handleClearSessions = () => {
    setSessions([]);
    setActiveSessionId(null);
    setInputValue('');
    setPendingReply(null);
    setIsLoading(false);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  // Keep the pending copy simple so the UI can swap cleanly from spinner to cards.
  // 保持等待文案简洁，这样界面可以从转圈平滑切换到卡片。
  const pendingReplyLabel = pendingReply
    ? pendingReply.stage === 'parsing'
      ? 'Getting your request ready...'
      : pendingReply.stage === 'retrieval'
        ? 'Checking the best food and drink matches...'
        : pendingReply.stage === 'generation'
          ? 'Putting together a friendly answer...'
          : 'Thinking...'
    : '';
  const pendingReplyTimestamp = pendingReply?.startedAt ?? null;

  const handleApplySuggestion = (suggestion) => {
    setInputValue(suggestion);
  };

  return {
    activeSessionId,
    currentMessages,
    defaultWelcomeMessage: DEFAULT_WELCOME_MESSAGE,
    handleApplySuggestion,
    handleSendMessage,
    inputValue,
    isLoading,
    pendingReply,
    pendingReplyLabel,
    pendingReplyTimestamp,
    scrollRef,
    sessions,
    handleClearSessions,
    handleDeleteSession,
    handleNewChat,
    setActiveSessionId,
    setInputValue,
  };
};
