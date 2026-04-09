import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar.jsx';
import Chat from './components/Chat.jsx';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('forkcast_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse sessions', e);
      }
    }
  }, []);

  const saveSessions = (newSessions) => {
    setSessions(newSessions);
    localStorage.setItem('forkcast_sessions', JSON.stringify(newSessions));
  };

  const handleNewChat = () => {
    const newSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [{
        id: uuidv4(),
        role: 'model',
        content: 'Hi there! I am Forkcast, your AI food assistant for the University of Auckland. What are you craving today? I can help you find dishes, combos, and the best places to get them on campus!',
        timestamp: Date.now()
      }],
      updatedAt: Date.now(),
    };
    const newSessions = [newSession, ...sessions];
    saveSessions(newSessions);
    setActiveSessionId(newSession.id);
  };

  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const updateSession = (updatedSession) => {
    const newSessions = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    saveSessions(newSessions);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
        onNewChat={handleNewChat} 
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {activeSession && (
          <Chat session={activeSession} onUpdateSession={updateSession} />
        )}
      </main>
    </div>
  );
}
