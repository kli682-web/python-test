import { MessageSquare, PlusCircle } from 'lucide-react';

export default function Sidebar({ sessions, activeSessionId, onSelectSession, onNewChat }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-orange-600 flex items-center gap-2">
          <span className="text-2xl">🍴</span> Forkcast
        </h1>
      </div>
      
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
        >
          <PlusCircle size={18} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition-colors ${
              activeSessionId === session.id 
                ? 'bg-orange-50 text-orange-700' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <MessageSquare size={18} className="mt-0.5 shrink-0 opacity-70" />
            <div className="flex-1 overflow-hidden">
              <div className="truncate font-medium text-sm">{session.title}</div>
              <div className="text-xs opacity-60 mt-0.5">
                {new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
