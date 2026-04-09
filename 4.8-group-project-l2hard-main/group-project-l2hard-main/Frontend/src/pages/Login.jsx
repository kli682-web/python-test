import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, ArrowLeft } from 'lucide-react'; // 🟢 引入返回箭头图标
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '', 
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Logging in with:', formData);
    navigate('/chat');
  };

  // Google 登录成功处理
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // 发送id_token到后端进行认证
      const response = await axios.post('http://localhost:3000/api/auth/google', {
        idToken: credentialResponse.credential
      });

      if (response.data.code === 200) {
        // 保存token到localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        navigate('/chat');
      }
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Google登录失败，请重试');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    alert('Google登录失败，请重试');
  };

  return (
    // 📱 适配点 1：外边距 p-6 改为手机 p-4，大屏 lg:p-8
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fdf5e6] p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000" alt="background" className="w-full h-full object-cover" />
      </div>

      {/* 📱 适配点 2：增加 flex-col lg:flex-row (手机竖直，电脑水平)；圆角调整为 rounded-3xl lg:rounded-[3rem] */}
      <div className="bg-white/70 backdrop-blur-xl w-full max-w-6xl rounded-3xl lg:rounded-[3rem] shadow-[0_20px_70px_-15px_rgba(141,110,99,0.15)] overflow-hidden flex flex-col lg:flex-row z-10 border border-white">
        
        {/* 左侧：欢迎区域 */}
        {/* 📱 适配点 3：手机端隐藏 (hidden)，大屏幕才显示 (lg:flex lg:w-1/2) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-orange-950 p-12 flex-col justify-between overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000" 
            alt="Login Welcome" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl shadow-inner">🍜</div>
             <span className="text-3xl font-bold tracking-tight text-white">LOG</span>
          </div>
          <div className="relative z-10 mb-10">
            <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Welcome <span className="text-orange-400">Back</span>, Foodie!
            </h2>
            <p className="text-white/80 text-lg max-w-md">Your personalized culinary recommendations are waiting.</p>
          </div>
        </div>

        {/* 右侧：登录表单 */}
        {/* 📱 适配点 4：手机端宽度 100% (w-full)，电脑端 50% (lg:w-1/2)；内边距手机小 (p-8)，电脑大 (lg:p-16) */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 bg-white/60">
          <div className="max-w-md mx-auto">
            
            {/* 🟢 新增：Back to Home 按钮 */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 transition-colors mb-8 font-semibold text-sm group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              Back to Home
            </Link>

            {/* 📱 适配点 5：调整标题和副标题的字号和间距 */}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight mb-2 lg:mb-3">Sign In</h1>
            <p className="text-sm lg:text-base text-stone-600 mb-8 lg:mb-10">Enter your details below to access your account.</p>
            
            {/* 📱 适配点 6：缩紧手机端表单元素的间距 space-y-5 */}
            <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
              
              {/* Username or Email - 🟢 删除了 placeholder */}
              <div className="relative">
                <label className="block text-sm font-bold text-stone-700 mb-2 px-1">Username or Email</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-14 pr-6 py-3.5 lg:py-4 rounded-full bg-white border border-stone-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none transition text-sm lg:text-base" 
                  />
                </div>
              </div>

              {/* Password - 🟢 删除了 placeholder */}
              <div className="relative">
                <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block text-sm font-bold text-stone-700">Password</label>
                    <a href="#" className="text-xs text-orange-600 font-semibold hover:text-orange-700">Forgot?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    className="w-full pl-14 pr-6 py-3.5 lg:py-4 rounded-full bg-white border border-stone-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none transition text-sm lg:text-base" 
                  />
                </div>
              </div>

              {/* 📱 适配点 7：调整按钮大小 */}
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 lg:py-4 rounded-full font-bold text-base lg:text-lg hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 mt-6 lg:mt-8 shadow-[0_10px_20px_-5px_rgba(249,115,22,0.3)]"
              >
                Sign In 🚀
              </button>

              {/* Google 登录按钮 */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-stone-500 text-xs lg:text-sm">Or continue with</span>
                  </div>
                </div>
                <div className="mt-4 w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
              </div>
            </form>

            <p className="text-center text-stone-600 mt-8 lg:mt-10 text-xs lg:text-sm">
              Don't have an account? <Link to="/register" className="text-orange-600 font-bold hover:text-orange-700 underline underline-offset-2">Create one for free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;