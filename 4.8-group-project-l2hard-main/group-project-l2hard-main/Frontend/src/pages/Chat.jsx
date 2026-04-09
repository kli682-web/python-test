import { useLocation } from 'react-router-dom';
import PageChatComposer from '../component/chat/PageChatComposer.jsx';
import PageChatMessages from '../component/chat/PageChatMessages.jsx';
import PageChatSidebar from '../component/chat/PageChatSidebar.jsx';
import { useChatPage } from '../hooks/useChatPage.js';

export default function ChatInterface() {
  const location = useLocation();
  const searchContext = location.state || null;
  const {
    activeSessionId,
    currentMessages,
    defaultWelcomeMessage,
    handleApplySuggestion,
    handleClearSessions,
    handleDeleteSession,
    handleNewChat,
    handleSendMessage,
    inputValue,
    isLoading,
    pendingReply,
    pendingReplyLabel,
    pendingReplyTimestamp,
    scrollRef,
    sessions,
    setActiveSessionId,
    setInputValue,
  } = useChatPage(searchContext);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fdf5e6] p-6 font-sans text-[#5d4037]">
      <PageChatSidebar
        activeSessionId={activeSessionId}
        onClearSessions={handleClearSessions}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        onSelectSession={setActiveSessionId}
        sessions={sessions}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/20 shadow-inner backdrop-blur-sm">
        <div className="pointer-events-none absolute right-10 top-10 flex select-none flex-col gap-4 text-6xl opacity-10">
          <span>🥟</span>
          <span>🥗</span>
          <span>🍕</span>
        </div>

        <header className="z-10 shrink-0 p-8 pb-4">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-800/80">
            Forkcast
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Your campus food guide for quick meals, drinks, and budget-friendly combos.
          </p>
        </header>

        <PageChatMessages
          messages={currentMessages}
          onSuggestionClick={handleApplySuggestion}
          pendingReply={pendingReply}
          pendingReplyLabel={pendingReplyLabel}
          pendingReplyTimestamp={pendingReplyTimestamp}
          scrollRef={scrollRef}
          welcomeMessage={defaultWelcomeMessage}
        />

        <PageChatComposer
          activeSessionId={activeSessionId}
          inputValue={inputValue}
          isLoading={isLoading}
          onChange={setInputValue}
          onSubmit={handleSendMessage}
        />
      </main>
    </div>
  );
}
