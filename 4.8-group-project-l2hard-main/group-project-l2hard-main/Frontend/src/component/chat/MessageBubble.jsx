import { Bot, Loader2, MapPin, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatTimestamp } from '../../utils/date.js';

/**
 * Regex for bare URLs (to filter/convert in assistant messages).
 */
const bareUrlPattern = /^https?:\/\/\S+$/i;

/**
 * Normalizes assistant Markdown: links restaurant names to map URLs.
 * @param {string} content - Raw assistant message.
 * @returns {string} Processed Markdown.
 */
const normalizeAssistantMarkdown = (content = '') => {
  const lines = content.split('\n');
  const normalizedLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const nextLine = lines[index + 1]?.trim();
    const restaurantMatch = currentLine.match(/^Restaurant:\s*(.+?)\s*$/i);

    if (restaurantMatch && nextLine && bareUrlPattern.test(nextLine)) {
      normalizedLines.push(`Restaurant: [${restaurantMatch[1].trim()}](${nextLine})`);
      index += 1;
      continue;
    }

    if (bareUrlPattern.test(currentLine.trim())) {
      continue;
    }

    normalizedLines.push(currentLine);
  }

  return normalizedLines.join('\n');
};

/**
 * Individual message bubble with avatar, timestamp, Markdown rendering.
 * Handles user/AI roles, pending states, custom link styling for maps.
 * @param {Object} message - {role, content, timestamp}.
 * @param {string} pendingReplyLabel - Label for pending reply.
 * @param {boolean} isPendingForMessage - If pending after this message.
 * @returns {JSX.Element} Bubble UI.
 */
export default function MessageBubble({ message, pendingReplyLabel, isPendingForMessage }) {
  const normalizedContent =
    message.role === 'assistant' ? normalizeAssistantMarkdown(message.content) : message.content;

  return (
    <div className={`flex gap-4 max-w-3xl mx-auto ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${message.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-orange-600 text-white'
        }`}>
        {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-2 mb-1 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
          <span className="font-semibold text-sm text-gray-700">{message.role === 'user' ? 'You' : 'Forkcast'}</span>
          <span className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
        </div>

        <div className={`px-5 py-4 rounded-2xl text-sm sm:text-base leading-relaxed ${message.role === 'user'
          ? 'bg-orange-50 text-gray-800 rounded-tr-sm'
          : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'
          }`}>
          {message.content ? (
            <div className="prose prose-sm sm:prose-base max-w-none prose-orange">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, children, ...props }) => {
                    const parentText = node?.parent?.children?.[0]?.value?.trim() ?? '';
                    const isRestaurantLine = parentText.startsWith('Restaurant:');
                    const isMapLine = parentText.startsWith('Map:');

                    return (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 font-medium no-underline transition-colors ${isRestaurantLine || isMapLine
                          ? 'rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-orange-700 hover:border-orange-300 hover:text-orange-800'
                          : 'rounded-md border border-orange-100 bg-orange-50 px-2.5 py-1 text-orange-600 hover:text-orange-800 hover:underline'
                          }`}
                      >
                        <MapPin size={14} />
                        {children}
                      </a>
                    );
                  },
                  p: ({ node, children, ...props }) => {
                    const textContent = node?.children?.map((child) => child.value ?? '').join('').trim() ?? '';
                    const isRestaurantLine = textContent.startsWith('Restaurant:');
                    const isMapLine = textContent.startsWith('Map:');

                    return (
                      <p
                        {...props}
                        className={isRestaurantLine || isMapLine ? 'flex flex-wrap items-center gap-2' : undefined}
                      >
                        {children}
                      </p>
                    );
                  }
                }}
              >
                {normalizedContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Thinking...
            </div>
          )}
        </div>

        {message.role === 'user' && isPendingForMessage && (
          <div className="mt-2 px-1 text-xs text-gray-500 flex items-center gap-2 justify-end">
            <Loader2 size={12} className="animate-spin text-orange-500" />
            <span>{pendingReplyLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
