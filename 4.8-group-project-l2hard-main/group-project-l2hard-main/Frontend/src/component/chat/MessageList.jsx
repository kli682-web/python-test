import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';

/**
 * Scrollable list of message bubbles with auto-scroll to bottom.
 * @param {Array} messages - Array of message objects.
 * @param {Object} pendingReply - Pending state.
 * @param {string} pendingReplyLabel - Pending label.
 * @returns {JSX.Element} Message container.
 */
export default function MessageList({ messages, pendingReply, pendingReplyLabel }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          pendingReplyLabel={pendingReplyLabel}
          isPendingForMessage={pendingReply?.userMessageId === message.id}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
