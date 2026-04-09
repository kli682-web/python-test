import { Send } from 'lucide-react';

/**
 * Chat input composer component with send button.
 * @param {string} input - Current input value.
 * @param {boolean} isLoading - Disable during AI response.
 * @param {Function} onInputChange - Handler for input change.
 * @param {Function} onSubmit - Form submit handler.
 * @returns {JSX.Element} Input form.
 */
export default function ChatComposer({ input, isLoading, onInputChange, onSubmit }) {
  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="E.g. I'm craving spicy noodles under $15..."
          className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-5 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 p-2 rounded-full text-orange-600 hover:bg-orange-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <Send size={20} />
        </button>
      </form>
      <div className="text-center mt-2 text-xs text-gray-400">
        Forkcast uses AI and may occasionally make mistakes.
      </div>
    </div>
  );
}
