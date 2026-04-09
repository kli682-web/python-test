import { useEffect, useState } from 'react';
import { CHAT_ERROR_MESSAGE, DEFAULT_CHAT_TITLE } from '../constants/chat.js';
import { requestChatResponse, requestConversationTitle } from '../services/chatApi.js';
import ChatComposer from './chat/ChatComposer.jsx';
import MessageList from './chat/MessageList.jsx';

/**
 * Generates unique ID for messages/sessions.
 * @returns {string} UUID.
 */
const createId = () => crypto.randomUUID();

export default function Chat({ session, onUpdateSession }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingReply, setPendingReply] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!pendingReply) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - pendingReply.startedAt) / 1000)));

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - pendingReply.startedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [pendingReply]);

  const buildUpdatedSession = (messages, overrides = {}) => ({
    ...session,
    ...overrides,
    messages,
    updatedAt: Date.now()
  });

  const generateTitle = async (messages) => {
    try {
      const data = await requestConversationTitle(messages);
      return data.title;
    } catch (error) {
      console.error('Title generation failed', error);
      return session.title;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: createId(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    const newMessages = [...session.messages, userMessage];
    onUpdateSession(buildUpdatedSession(newMessages));

    setInput('');
    setIsLoading(true);
    setPendingReply({
      userMessageId: userMessage.id,
      startedAt: Date.now(),
      stage: 'sending'
    });

    try {
      const response = await requestChatResponse(newMessages);

      if (!response.ok) throw new Error('Failed to get response');

      setPendingReply((current) => current ? { ...current, stage: 'thinking' } : null);

      const modelMessageId = createId();
      const data = await response.json();
      const modelContent = data.reply_text || data.follow_up_question || '';

      setPendingReply(null);

      onUpdateSession(buildUpdatedSession([
        ...newMessages,
        {
          id: modelMessageId,
          role: 'model',
          content: modelContent,
          structuredContent: data,
          timestamp: Date.now()
        }
      ]));

      if (session.title === DEFAULT_CHAT_TITLE && newMessages.length === 2) {
        const newTitle = await generateTitle(newMessages);
        onUpdateSession(buildUpdatedSession([
          ...newMessages,
          {
            id: modelMessageId,
            role: 'model',
            content: modelContent,
            structuredContent: data,
            timestamp: Date.now()
          }
        ], { title: newTitle }));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setPendingReply(null);

      onUpdateSession(buildUpdatedSession([
        ...newMessages,
        {
          id: createId(),
          role: 'model',
          content: CHAT_ERROR_MESSAGE,
          timestamp: Date.now()
        }
      ]));
    } finally {
      setPendingReply(null);
      setIsLoading(false);
    }
  };

  const getPendingReplyLabel = () => {
    if (!pendingReply) return '';
    if (pendingReply.stage === 'sending') {
      return `Forkcast is thinking... ${elapsedSeconds}s`;
    }

    return `Forkcast is working... ${elapsedSeconds}s`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <MessageList
        messages={session.messages}
        pendingReply={pendingReply}
        pendingReplyLabel={getPendingReplyLabel()}
      />
      <ChatComposer
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
