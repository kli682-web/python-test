import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  // 处理登录提交
  const handleLogin = (e) => {
    e.preventDefault(); // 阻止页面刷新
    console.log("正在验证并登录...");
    
    // 模拟成功后跳转回首页
    navigate('/'); 
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-cover bg-center relative" 
         style={{ backgroundImage: `url('https://images.unsplash.com/photo-149485981460c-3c0a9c6a5948?w=1600')` }}>
      
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 flex w-full max-w-5xl h-[75vh] bg-white/40 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/30">
        
        {/* 左侧：引导区 */}
        <div className="hidden md:flex flex-1 flex-col justify-center items-center p-12 text-stone-800">
          <p className="text-stone-300 text-sm font-black uppercase tracking-[0.3em] mb-4">Welcome Back</p>
          <h1 className="text-7xl font-serif italic mb-10 text-white text-center">Hungry <br/> again?</h1>
          
          <div className="flex flex-col gap-5 w-72">
            <button 
              onClick={() => navigate('/register')}
              className="w-full bg-white/20 hover:bg-white/30 border border-white/50 text-white font-bold py-4 rounded-2xl transition-all shadow-sm backdrop-blur-sm"
            >
              Create an account
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-transparent hover:bg-white/10 text-stone-200 font-medium py-3 rounded-2xl transition-all text-sm underline-offset-4 hover:underline"
            >
              Return to Homepage
            </button>
          </div>
        </div>

        {/* 右侧：登录表单 */}
        <div className="flex-1 bg-white p-12 md:p-16 flex flex-col justify-center relative">
          
          <div className="mb-10">
            <h2 className="text-3xl font-black text-stone-800 mb-2">Sign In</h2>
            <p className="text-stone-500 font-medium text-sm">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            <div className="space-y-1">
              <label className="text-stone-500 font-bold text-sm px-1">Email</label>
              <input required type="email" placeholder="name@example.com" className="w-full bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-4 outline-none focus:border-orange-400 transition-all shadow-inner" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-stone-500 font-bold text-sm">Password</label>
                <span className="text-orange-600 text-xs font-bold hover:underline cursor-pointer">Forgot?</span>
              </div>
              {/* 🌟 核心修改：在这里移除了 placeholder="••••••••" */}
              <input required type="password" placeholder="" className="w-full bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-4 outline-none focus:border-orange-400 transition-all shadow-inner" />
            </div>

            <button type="submit" className="w-full bg-[#b36a5b] hover:bg-[#9a5b4e] text-white font-bold py-5 rounded-2xl shadow-lg transition-all mt-4 text-lg">
              Sign In
            </button>

            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-stone-300"></div>
                <span className="flex-shrink mx-4 text-stone-400 text-sm italic">or</span>
                <div className="flex-grow border-t border-stone-300"></div>
            </div>

            <button type="button" className="w-full bg-white border-2 border-stone-200 py-4 rounded-2xl font-bold text-stone-700 flex items-center justify-center gap-3 hover:bg-stone-50 transition-all shadow-sm">
              <span className="text-xl">G</span> Continue with Google
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}