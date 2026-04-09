import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, Loader2, User, Bot, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const getSuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const day = d.getDate();
  const suffix = getSuffix(day);
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}${suffix} ${month} ${hours}:${minutes}`;
};

export default function Chat({ session, onUpdateSession }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);

  const generateTitle = async (messages) => {
    try {
      const response = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      if (response.ok) {
        const data = await response.json();
        return data.title;
      }
    } catch (e) {
      console.error('Title generation failed', e);
    }
    return session.title;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    const newMessages = [...session.messages, userMessage];
    
    // Update session immediately with user message
    onUpdateSession({
      ...session,
      messages: newMessages,
      updatedAt: Date.now()
    });
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error('Failed to get response');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const modelMessageId = uuidv4();
      let modelContent = '';

      // Add empty model message
      onUpdateSession({
        ...session,
        messages: [...newMessages, { id: modelMessageId, role: 'model', content: '', timestamp: Date.now() }],
        updatedAt: Date.now()
      });

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        modelContent += chunk;

        onUpdateSession({
          ...session,
          messages: [...newMessages, { id: modelMessageId, role: 'model', content: modelContent, timestamp: Date.now() }],
          updatedAt: Date.now()
        });
      }

      // Generate title if this is the first user message
      if (session.title === 'New Chat' && newMessages.length === 2) {
        const newTitle = await generateTitle(newMessages);
        onUpdateSession({
          ...session,
          title: newTitle,
          messages: [...newMessages, { id: modelMessageId, role: 'model', content: modelContent, timestamp: Date.now() }],
          updatedAt: Date.now()
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      onUpdateSession({
        ...session,
        messages: [...newMessages, { 
          id: uuidv4(), 
          role: 'model', 
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: Date.now()
        }],
        updatedAt: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {session.messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
              msg.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-orange-600 text-white'
            }`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className="font-semibold text-sm text-gray-700">{msg.role === 'user' ? 'You' : 'Forkcast'}</span>
                <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
              </div>
              <div className={`px-5 py-4 rounded-2xl text-sm sm:text-base leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-orange-50 text-gray-800 rounded-tr-sm' 
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'
              }`}>
                {msg.content ? (
                  <div className="prose prose-sm sm:prose-base max-w-none prose-orange">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-800 font-medium no-underline hover:underline bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 transition-colors">
                            <MapPin size={14} />
                            {props.children}
                          </a>
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
    </div>
  );
}
