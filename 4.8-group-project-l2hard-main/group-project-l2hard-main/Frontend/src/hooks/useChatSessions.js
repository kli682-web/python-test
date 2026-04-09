import { useState } from 'react';
import {
  CHAT_STORAGE_KEY,
  DEFAULT_CHAT_TITLE,
  DEFAULT_WELCOME_MESSAGE,
} from '../constants/chat.js';

const createId = () => crypto.randomUUID();

const createWelcomeMessage = () => ({
  id: createId(),
  role: 'model',
  content: DEFAULT_WELCOME_MESSAGE,
  timestamp: Date.now()
});

const createSession = () => ({
  id: createId(),
  title: DEFAULT_CHAT_TITLE,
  messages: [createWelcomeMessage()],
  updatedAt: Date.now(),
});

const loadInitialSessions = () => {
  const savedSessions = localStorage.getItem(CHAT_STORAGE_KEY);

  if (!savedSessions) {
    return [createSession()];
  }

  try {
    const parsedSessions = JSON.parse(savedSessions);
    return Array.isArray(parsedSessions) && parsedSessions.length > 0
      ? parsedSessions
      : [createSession()];
  } catch (error) {
    console.error('Failed to parse sessions', error);
    return [createSession()];
  }
};

export const useChatSessions = () => {
  const [sessions, setSessions] = useState(loadInitialSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const saveSessions = (nextSessions) => {
    setSessions(nextSessions);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextSessions));
  };

  const handleNewChat = () => {
    const newSession = createSession();
    saveSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
  };

  const updateSession = (updatedSession) => {
    saveSessions(sessions.map((session) => (
      session.id === updatedSession.id ? updatedSession : session
    )));
  };

  const resolvedActiveSessionId = activeSessionId ?? sessions[0]?.id ?? null;
  const activeSession = sessions.find((session) => session.id === resolvedActiveSessionId) || sessions[0] || null;

  return {
    activeSession,
    activeSessionId: resolvedActiveSessionId,
    sessions,
    setActiveSessionId,
    handleNewChat,
    updateSession,
  };
};
