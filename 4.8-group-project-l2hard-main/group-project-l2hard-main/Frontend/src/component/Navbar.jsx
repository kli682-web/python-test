import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // 🟢 引入响应式菜单图标

// 1. 优化后的 NavItem：增强字体层级和激活状态的色彩度
const NavItem = ({ icon, label, active = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`
    flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group
    ${active 
      // 🟢 激活状态：微渐变底色 + 暖色阴影 + 亮橘色边框，极具视觉焦点
      ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 font-extrabold shadow-[0_4px_15px_-3px_rgba(249,115,22,0.15)] border border-orange-200/60' 
      // 🟢 未激活状态：柔和的石板灰，悬停时带有橘色呼吸感
      : 'text-stone-500 hover:bg-orange-50/50 hover:text-orange-700 font-semibold border border-transparent'}
  `}>
    <span className={`text-xl transition-transform duration-300 ${active ? 'scale-110 drop-shadow-sm' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110'}`}>
      {icon}
    </span>
    <span className="text-[15px] tracking-tight">{label}</span>
  </div>
);

export default function Navbar() {
  const navigate = useNavigate(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 🟢 移动端菜单状态

  return (
    // 📱 适配点 1：外层容器。手机端为横向吸顶 (w-full, h-auto)，PC端为左侧边栏 (md:w-64, md:h-screen)
    <aside className="w-full md:w-64 bg-white/95 md:bg-white/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-orange-100/50 flex flex-col md:p-6 h-auto md:h-screen shrink-0 sticky top-0 z-50 transition-all">
      
      {/* 📱 适配点 2：顶部横幅区域 (Logo + 手机端汉堡按钮) */}
      <div className="flex items-center justify-between p-4 md:p-0 md:mb-10">
        
        {/* Logo 区域：增强了色彩度和排版 */}
        <div 
          className="flex items-center gap-3 md:px-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <span className="text-3xl md:text-2xl drop-shadow-sm group-hover:scale-105 transition-transform">🍽️</span> 
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-600 to-orange-400 tracking-tight leading-none mb-0.5">
              Forkcast
            </h1>
            <p className="text-[10px] font-extrabold text-stone-400 tracking-widest uppercase">
              Food AI assistant
            </p>
          </div>
        </div>

        {/* 📱 手机端专属：汉堡菜单切换按钮 */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
        </button>
      </div>

      {/* 📱 适配点 3：可折叠的菜单内容区域。手机端绝对定位覆盖在下方，PC端正常流式布局 */}
      <div className={`
        ${isMobileMenuOpen ? 'absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-orange-100 shadow-2xl flex p-5' : 'hidden'} 
        md:static md:flex md:w-auto md:bg-transparent md:border-none md:shadow-none md:p-0 
        flex-col flex-1 z-40 max-h-[85vh] overflow-y-auto custom-scrollbar
      `}>
        
        {/* 主功能区 */}
        <nav className="flex flex-col gap-1.5 mb-8">
          <NavItem icon="🏠" label="Home" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} active />
          <NavItem icon="💬" label="Chat" onClick={() => { navigate('/chat'); setIsMobileMenuOpen(false); }} />
          <NavItem icon="📊" label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem icon="📖" label="Our Story" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem icon="💡" label="Feedback" onClick={() => setIsMobileMenuOpen(false)} />
        </nav>

        {/* 装饰性分割线：更精细的色彩 */}
        <div className="flex items-center gap-3 mb-6 px-3">
          <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent flex-1"></div>
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-50 px-2 py-0.5 rounded-full">
            Your Kitchen
          </span>
          <div className="h-px bg-gradient-to-r from-stone-200 via-stone-200 to-transparent flex-1"></div>
        </div>

        {/* 个人/工具区 */}
        <nav className="flex flex-col gap-1.5 mb-8 md:mb-0">
          <NavItem icon="⚙️" label="Preferences" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem icon="❤️" label="Favorites" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem icon="🕒" label="History" onClick={() => setIsMobileMenuOpen(false)} />
        </nav>

        {/* 2. 底部用户信息区域：悬浮卡片化 */}
        <div className="mt-auto md:pt-6 border-t border-stone-100/80">
          <div 
            onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 p-3 bg-gradient-to-br from-stone-50 to-white rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-orange-500/10 border border-stone-200 hover:border-orange-300 transition-all duration-300 group"
          >
            {/* 头像部分 */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center text-sm font-black text-orange-800 shadow-inner group-hover:scale-105 transition-transform">
              AX
            </div>
            {/* 文字部分 */}
            <div className="flex flex-col justify-center">
              <span className="text-[15px] font-extrabold text-stone-700 leading-none mb-1 group-hover:text-orange-600 transition-colors">
                Sign In
              </span>
              <span className="text-[11px] font-semibold text-stone-400 tracking-wide group-hover:text-orange-500 transition-colors">
                Access your kitchen
              </span>
            </div>
            {/* 小箭头装饰：增加了动画 */}
            <span className="ml-auto mr-1 text-stone-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-300 font-bold">
              →
            </span>
          </div>
        </div>

      </div>
    </aside>
  );
}