import { useState } from 'react'; // 🟢 新增：引入 useState 控制抽屉开关
import { Link } from 'react-router-dom';
import { Home, History, LogOut, MessageSquare, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'; // 🟢 新增：引入左右箭头图标
import { formatChatDateTime } from '../../utils/date.js';

export default function PageChatSidebar({
  activeSessionId,
  onClearSessions,
  onDeleteSession,
  onNewChat,
  onSelectSession,
  sessions,
}) {
  const [isOpen, setIsOpen] = useState(false); // 🟢 新增：移动端侧边栏开关状态

  const handleClearAll = () => {
    if (sessions.length === 0) return;

    const confirmed = window.confirm(
      'Clear all recent chats? This cannot be undone.'
    );

    if (confirmed) {
      onClearSessions();
    }
  };

  const handleDeleteOne = (sessionId, sessionTitle) => {
    const confirmed = window.confirm(
      `Delete "${sessionTitle}" from recent chats?`
    );

    if (confirmed) {
      onDeleteSession(sessionId);
    }
  };

  return (
    <>
      {/* 🟢 新增：移动端打开时的半透明背景遮罩，点击可关闭 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🟢 修改：调整 `<aside>` 的类名
          - 移动端 (默认)：fixed 绝对定位，脱离文档流，通过 translate-x 控制拉出
          - 电脑端 (md:)：relative 相对定位，取消位移，恢复你原本的样式 */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex h-full w-64 min-h-0 flex-col overflow-visible rounded-r-3xl border border-white/50 bg-white/90 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:mr-6 md:translate-x-0 md:overflow-hidden md:rounded-3xl md:bg-white/40 md:shadow-sm md:backdrop-blur-md
      `}>
        
        {/* 🟢 新增：附着在侧边栏边缘的“拉出/收回”箭头按钮 (仅移动端显示) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-1/2 -right-10 z-50 flex h-16 w-10 -translate-y-1/2 items-center justify-center rounded-r-2xl border border-l-0 border-white/50 bg-white/90 text-[#e64a19] shadow-[4px_0_15px_-3px_rgba(0,0,0,0.1)] md:hidden"
        >
          {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        {/* ================= 下方完全保留你的原始代码 ================= */}
        
        <div className="mb-6 flex shrink-0 cursor-default items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8d6e63] text-xl text-white shadow-md">
            🍜
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#4e342e]">
            LOG
          </span>
        </div>

        <button
          onClick={() => { onNewChat(); setIsOpen(false); }} // 🟢 微调：新建对话后自动收起侧边栏
          className="mb-6 flex shrink-0 items-center gap-3 rounded-2xl bg-[#e64a19] px-4 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#d84315] hover:shadow-lg"
        >
          <MessageSquare size={18} />
          <span>New Chat</span>
          <Plus size={18} className="ml-auto" />
        </button>

        <div className="custom-scrollbar -mx-2 min-h-0 flex-1 overflow-y-auto px-2">
          <div className="mb-3 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-stone-500">
            <History size={14} />
            <span className="flex-1">Recent Chats</span>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={sessions.length === 0}
              className="rounded-full p-1 text-stone-400 transition-colors hover:bg-white/60 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Clear all chats"
              title="Clear all chats"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={`group flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  activeSessionId === session.id
                    ? 'bg-white/80 font-semibold text-[#4e342e] shadow-sm'
                    : 'text-stone-500 hover:bg-white/50 hover:text-[#4e342e]'
                }`}
                title={session.title}
              >
                <button
                  type="button"
                  onClick={() => { onSelectSession(session.id); setIsOpen(false); }} // 🟢 微调：切换对话后自动收起侧边栏
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <MessageSquare
                    size={14}
                    className={`shrink-0 ${
                      activeSessionId === session.id
                        ? 'text-[#e64a19]'
                        : 'opacity-40 group-hover:opacity-100'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{session.title}</div>
                    <div className="mt-0.5 text-[10px] text-stone-400">
                      {formatChatDateTime(session.updatedAt)}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteOne(session.id, session.title);
                  }}
                  className="rounded-full p-1 text-stone-400 opacity-0 transition-all hover:bg-white/60 hover:text-red-500 group-hover:opacity-100 md:opacity-0 opacity-100" // 🟢 微调：手机端始终显示删除按钮防止无法 hover
                  aria-label={`Delete ${session.title}`}
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 shrink-0 space-y-2 border-t border-white/40 pt-4">
          <Link
            to="/"
            className="group flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-stone-600 transition-colors hover:bg-white/50 hover:text-[#4e342e]"
          >
            <Home
              size={18}
              className="text-stone-400 transition-colors group-hover:text-[#e64a19]"
            />
            <span className="text-sm font-semibold">Back to Home</span>
          </Link>

          <div className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-white/30 p-2 transition-colors hover:bg-white/50">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
              alt="Avatar"
              className="h-10 w-10 rounded-full border-2 border-white bg-amber-100"
            />
            <span className="flex-1 text-sm font-semibold text-[#4e342e]">
              Alex
            </span>
            <LogOut
              size={18}
              className="text-gray-400 transition-colors group-hover:text-red-500"
            />
          </div>
        </div>
      </aside>
    </>
  );
}