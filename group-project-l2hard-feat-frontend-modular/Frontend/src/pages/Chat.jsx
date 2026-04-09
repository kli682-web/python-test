import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, MessageSquare, LayoutDashboard, Settings, 
  Heart, History, Mic, Send, Smile, Image as ImageIcon, LogOut 
} from 'lucide-react';

const ChatInterface = () => {
  const location = useLocation();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, type: 'user', text: "I'm looking for a light lunch under $15. Salad maybe?", time: "11:42 AM" },
    { id: 2, type: 'ai', text: "Sure thing! With that budget, I can find some great options near you.", time: "11:43 AM" },
  ]);
  
  const scrollRef = useRef(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // 添加用户消息
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    // 模拟 AI 回复
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        type: 'ai',
        text: "That sounds delicious! Checking my culinary database for the best options...",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <div className="flex h-screen w-full bg-[#fdf5e6] p-6 font-sans text-[#5d4037] overflow-hidden">
      
      {/* 1. 左侧导航栏 */}
      <aside className="flex flex-col w-64 bg-white/40 backdrop-blur-md rounded-3xl p-6 mr-6 border border-white/50 shadow-sm transition-all">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-default">
          <div className="w-10 h-10 bg-[#8d6e63] rounded-full flex items-center justify-center text-white text-xl shadow-md">
            🍜
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#4e342e]">LOG</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem to="/" icon={<Home size={20} />} label="Home" active={location.pathname === '/'} />
          <NavItem to="/chat" icon={<MessageSquare size={20} />} label="Chat" active={location.pathname === '/chat'} />
          <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/preferences" icon={<Settings size={20} />} label="Preferences" />
          <NavItem to="/favorites" icon={<Heart size={20} />} label="Favorites" />
          <NavItem to="/history" icon={<History size={20} />} label="History" />
        </nav>

        <div className="mt-auto flex items-center gap-3 p-2 bg-white/30 rounded-2xl hover:bg-white/50 transition-colors cursor-pointer group">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" className="w-10 h-10 rounded-full bg-amber-100 border-2 border-white" />
          <span className="font-semibold flex-1 text-sm">Alex</span>
          <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
        </div>
      </aside>

      {/* 2. 主聊天区域 */}
      <main className="flex-1 flex flex-col bg-white/20 backdrop-blur-sm rounded-3xl border border-white/30 relative shadow-inner overflow-hidden">
        
        {/* 背景装饰插画 */}
        <div className="absolute top-10 right-10 opacity-10 pointer-events-none select-none text-6xl flex flex-col gap-4">
          <span>🥟</span><span>🥗</span><span>🍕</span>
        </div>

        <header className="p-8 pb-4 z-10">
          <h1 className="text-3xl font-semibold text-gray-800/80 tracking-tight">AI Culinary Assistant</h1>
        </header>

        {/* 聊天内容区域 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              {msg.type === 'ai' && (
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-orange-100 text-lg">🍜</div>
              )}
              
              <div className={`max-w-[70%] space-y-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
                <p className="text-[10px] text-gray-500 px-2">{msg.time}</p>
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.type === 'user' 
                  ? 'bg-[#ffccbc] rounded-tr-none text-[#4e342e]' 
                  : 'bg-white/80 backdrop-blur-sm rounded-tl-none border border-white/60 text-gray-700'
                }`}>
                  {msg.text}
                </div>
              </div>

              {msg.type === 'user' && (
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Me" />
              )}
            </div>
          ))}

          {/* 推荐卡片 (模拟) */}
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 delay-500 duration-500">
             <div className="w-10" /> 
             <div className="w-80 bg-[#1a1a1a] text-white rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all cursor-pointer">
                <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" alt="Pizza" className="h-40 w-full object-cover opacity-90" />
                <div className="p-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg font-serif">Mamma Mia's Pizzeria</h3>
                    <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">4.6 ★</span>
                  </div>
                  <p className="text-[11px] text-gray-400">300m away • Caesar Salad ($9.5) + Juice ($3) = Total: $12.5</p>
                  <div className="flex gap-4 pt-3 mt-1 border-t border-white/10 text-[10px] text-gray-400 font-medium">
                    <span className="hover:text-white transition-colors">📍 View on Google Maps</span>
                    <span className="hover:text-white transition-colors">♡ Add to Favorites</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* 3. 底部输入框 */}
        <div className="p-8 pt-2 z-10">
          <div className="bg-[#a0522d] rounded-full px-6 py-3 flex items-center gap-4 shadow-xl border border-white/10 focus-within:ring-2 ring-orange-300 transition-all">
            <Mic size={20} className="text-white/60 cursor-pointer hover:text-white transition-colors" />
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your culinary question here..." 
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 text-sm"
            />
            <div className="flex gap-4 text-white/60 items-center">
              <Smile size={20} className="cursor-pointer hover:text-white" />
              <ImageIcon size={20} className="cursor-pointer hover:text-white" />
              <button 
                onClick={handleSendMessage}
                className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors text-white"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// 侧边栏菜单项组件
const NavItem = ({ icon, label, to, active = false }) => (
  <Link 
    to={to || "#"} 
    className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 group ${
      active 
      ? 'bg-[#ffccbc]/60 text-[#4e342e] shadow-sm font-semibold' 
      : 'hover:bg-white/40 text-gray-500 hover:text-[#4e342e]'
    }`}
  >
    <span className={`${active ? 'text-[#e64a19]' : 'text-gray-400 group-hover:text-[#e64a19]'} transition-colors`}>
      {icon}
    </span>
    <span className="text-sm">{label}</span>
  </Link>
);

export default ChatInterface;