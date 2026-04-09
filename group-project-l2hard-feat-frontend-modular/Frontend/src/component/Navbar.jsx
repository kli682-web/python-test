import { useNavigate } from 'react-router-dom';

// 1. 定义子组件 NavItem (保持不变)
const NavItem = ({ icon, label, active = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`
    flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 group
    ${active 
      ? 'bg-orange-100 text-orange-800 font-bold shadow-sm' 
      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium'}
  `}>
    <span className={`text-xl ${active ? '' : 'grayscale group-hover:grayscale-0'}`}>
      {icon}
    </span>
    <span className="text-[15px]">{label}</span>
  </div>
);

export default function Navbar() {
  const navigate = useNavigate(); // 初始化导航

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-stone-200 flex flex-col p-6 h-screen shrink-0 sticky top-0">
      
      {/* 1. Logo 区域：增加点击回首页的功能 */}
      <div 
        className="flex items-start gap-3 px-3 mb-10 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/')}
      >
        <span className="text-2xl pt-1">🍽️</span> 
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-stone-800 leading-tight tracking-tight">
            Forkcast
          </h1>
          <p className="text-xs font-semibold text-stone-400">
            Food AI assistant
          </p>
        </div>
      </div>

      {/* 主功能区 */}
      <nav className="flex flex-col gap-1 mb-8">
        <NavItem icon="🏠" label="Home" onClick={() => navigate('/')} active />
        <NavItem icon="💬" label="Chat" onClick={() => navigate('/chat')} />
        <NavItem icon="📊" label="Dashboard" />
        <NavItem icon="📖" label="Our Story" />
        <NavItem icon="💡" label="Feedback" />
      </nav>

      {/* 装饰性分割线 (保持不变) */}
      <div className="flex items-center gap-2 mb-6 px-3">
        <div className="h-[1px] bg-stone-200 flex-1"></div>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          Your Kitchen
        </span>
        <div className="h-[1px] bg-stone-200 flex-1"></div>
      </div>

      {/* 个人/工具区 */}
      <nav className="flex flex-col gap-1">
        <NavItem icon="⚙️" label="Preferences" />
        <NavItem icon="❤️" label="Favorites" />
        <NavItem icon="🕒" label="History" />
      </nav>

      {/* 2. 底部用户信息区域：改为跳转到登录页的入口 */}
      <div className="mt-auto pt-6 border-t border-stone-100">
        <div 
          onClick={() => navigate('/login')}
          className="flex items-center gap-3 px-3 py-3 bg-stone-50 rounded-2xl cursor-pointer hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all group"
        >
          {/* 头像部分 */}
          <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-sm font-bold text-orange-700 group-hover:bg-orange-300 transition-colors">
            AX
          </div>
          {/* 文字部分 */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-stone-700 leading-none group-hover:text-orange-900">
              Sign In
            </span>
            <span className="text-[10px] text-stone-400 group-hover:text-orange-600">
              Access your kitchen
            </span>
          </div>
          {/* 增加一个向右的小箭头装饰 */}
          <span className="ml-auto text-stone-300 group-hover:text-orange-400">→</span>
        </div>
      </div>
      
    </aside>
  );
}