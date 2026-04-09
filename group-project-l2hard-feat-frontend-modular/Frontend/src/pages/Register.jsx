import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  // 新增一个状态来实时显示滑条的预算数值
  const [budget, setBudget] = useState(15);

  // 处理注册提交
  const handleRegister = (e) => {
    e.preventDefault();
    alert("Welcome to Forkcast! Your account is ready.");
    navigate('/'); // 注册成功回首页
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-cover bg-center relative" 
         style={{ backgroundImage: `url('https://images.unsplash.com/photo-1505935428862-770b6f24f629?w=1600')` }}>
      
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 flex w-full max-w-5xl h-[90vh] bg-white/40 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/30">
        
        {/* 左侧：引导区 */}
        <div className="hidden md:flex flex-1 flex-col justify-center items-center p-12 text-white">
          <p className="text-stone-300 text-sm font-black uppercase tracking-[0.3em] mb-4">Start your</p>
          <h1 className="text-7xl font-serif italic mb-10 text-center">food <br/> journey</h1>
          
          <div className="flex flex-col gap-5 w-72 mt-8">
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-transparent hover:bg-white/10 text-stone-200 font-medium py-3 rounded-2xl transition-all text-sm underline-offset-4 hover:underline"
            >
              Return to Homepage
            </button>
          </div>
        </div>

        {/* 右侧：注册表单 */}
        {/* 🌟 核心修改：加入了 overflow-y-auto 确保内容多的时候可以内部滚动，不撑破页面 */}
        <div className="flex-[1.2] bg-white p-10 md:p-14 flex flex-col relative overflow-y-auto custom-scrollbar">
          
          <div className="mb-6 shrink-0">
            <h2 className="text-3xl font-black text-stone-800 mb-2">Sign Up</h2>
            <p className="text-stone-500 font-medium text-sm">Start your food journey today!</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            
            {/* 🌟 First Name & Last Name (并排) */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-stone-500 font-bold text-xs ml-1 uppercase tracking-wider">First Name</label>
                {/* 🌟 核心修改：placeholder:text-stone-400 placeholder:font-normal 让提示字变浅 */}
                <input required type="text" placeholder="John" className="w-full text-stone-700 bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-3 outline-none focus:border-orange-400 transition-all shadow-inner placeholder:text-stone-400 placeholder:font-normal" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-stone-500 font-bold text-xs ml-1 uppercase tracking-wider">Last Name</label>
                <input required type="text" placeholder="Doe" className="w-full text-stone-700 bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-3 outline-none focus:border-orange-400 transition-all shadow-inner placeholder:text-stone-400 placeholder:font-normal" />
              </div>
            </div>

            {/* Email 栏 */}
            <div className="space-y-1">
              <label className="text-stone-500 font-bold text-xs ml-1 uppercase tracking-wider">Email Address</label>
              <input required type="email" placeholder="name@example.com" className="w-full text-stone-700 bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-3 outline-none focus:border-orange-400 transition-all shadow-inner placeholder:text-stone-400 placeholder:font-normal" />
            </div>

            {/* 🌟 Password & Confirm Password (并排节省空间) */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-stone-500 font-bold text-xs ml-1 uppercase tracking-wider">Password</label>
                <input required type="password" placeholder="" className="w-full text-stone-700 bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-3 outline-none focus:border-orange-400 transition-all shadow-inner" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-stone-500 font-bold text-xs ml-1 uppercase tracking-wider">Confirm</label>
                <input required type="password" placeholder="" className="w-full text-stone-700 bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-3 outline-none focus:border-orange-400 transition-all shadow-inner" />
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-t border-stone-200 my-2"></div>

            {/* 🌟 新增：Budget Slider (滑条) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-stone-500 font-bold text-xs uppercase tracking-wider">Typical Lunch Budget</label>
                <span className="text-orange-600 font-black text-sm">${budget}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full h-1.5 bg-stone-200 rounded-lg accent-orange-500 cursor-pointer appearance-none"
              />
            </div>

            {/* 🌟 新增：Preferred Cuisine (下拉菜单) */}
            <div className="space-y-1">
              <label className="text-stone-500 font-bold text-xs ml-1 uppercase tracking-wider">Preferred Cuisine</label>
              <select defaultValue="" className="w-full text-stone-600 bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-3 outline-none focus:border-orange-400 transition-all shadow-inner cursor-pointer appearance-none">
                <option value="" disabled>Select your favorite...</option>
                <option value="asian">Asian (Ramen, Sushi, etc.)</option>
                <option value="western">Western (Burgers, Pasta, etc.)</option>
                <option value="healthy">Healthy (Salads, Wraps)</option>
                <option value="cafe">Cafe & Bakery</option>
                <option value="anything">I eat anything!</option>
              </select>
            </div>

            {/* 🌟 新增：Dietary Restrictions (下拉菜单) */}
            <div className="space-y-1 mb-2">
              <label className="text-stone-500 font-bold text-xs ml-1 uppercase tracking-wider">Dietary Restrictions</label>
              <select defaultValue="none" className="w-full text-stone-600 bg-[#fcf9f2] border-2 border-stone-200 rounded-2xl p-3 outline-none focus:border-orange-400 transition-all shadow-inner cursor-pointer appearance-none">
                <option value="none">None</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="halal">Halal</option>
                <option value="gluten-free">Gluten-Free</option>
                <option value="nut-allergy">Nut Allergy</option>
              </select>
            </div>

            {/* 注册提交按钮 */}
            <button type="submit" className="w-full shrink-0 bg-[#b36a5b] hover:bg-[#9a5b4e] text-white font-bold py-4 rounded-2xl shadow-lg transition-all text-lg mt-2">
              Create Account
            </button>

            {/* 返回登录的链接 */}
            <div className="text-center mt-2 pb-4 shrink-0">
              <span className="text-stone-500 text-sm font-medium">Already have an account? </span>
              <button 
                type="button" 
                onClick={() => navigate('/login')} 
                className="text-orange-600 font-bold hover:underline text-sm"
              >
                Log In
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}