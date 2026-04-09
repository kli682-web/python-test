import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const cuisineOptions = [
  { id: "salad", icon: "🥗", label: "Salad" },
  { id: "burger", icon: "🍔", label: "Burger" },
  { id: "sandwich", icon: "🥪", label: "Sandwich" },
  { id: "pizza", icon: "🍕", label: "Pizza" },
  { id: "sushi", icon: "🍣", label: "Sushi" },
  { id: "pasta", icon: "🍝", label: "Pasta" },
  { id: "noodles", icon: "🍜", label: "Noodles" }
];

const distanceOptions = [
  { value: "5", label: "Within 5 min walk" },
  { value: "10", label: "Within 10 min walk" },
  { value: "15", label: "Within 15 min walk" }, 
  { value: "20", label: "Within 20 min walk" }
];

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    cuisine: 'salad', 
    distance: '10',  
  });

  const [isCuisineOpen, setIsCuisineOpen] = useState(false);
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);

  const cuisineRef = useRef(null);
  const distanceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (cuisineRef.current && !cuisineRef.current.contains(event.target)) setIsCuisineOpen(false);
      if (distanceRef.current && !distanceRef.current.contains(event.target)) setIsDistanceOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registering with:', formData);
    if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!");
        return;
    }
    navigate('/login');
  };

  const currentCuisine = cuisineOptions.find(c => c.id === formData.cuisine);
  const currentDistance = distanceOptions.find(d => d.value === formData.distance);

  return (
    // 📱 适配点 1：外边距 p-6 改为手机 p-4，平板 p-6，大屏 lg:p-8
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fdf5e6] p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000" alt="background" className="w-full h-full object-cover" />
      </div>

      {/* 📱 适配点 2：增加 flex-col lg:flex-row (手机竖直，电脑水平)；圆角调整为 rounded-3xl lg:rounded-[3rem] */}
      <div className="bg-white/70 backdrop-blur-xl w-full max-w-6xl rounded-3xl lg:rounded-[3rem] shadow-[0_20px_70px_-15px_rgba(141,110,99,0.15)] overflow-hidden flex flex-col lg:flex-row z-10 border border-white">
        
        {/* 左侧：欢迎区域 */}
        {/* 📱 适配点 3：手机端隐藏 (hidden)，大屏幕才显示 (lg:flex lg:w-1/2) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-amber-950 p-12 flex-col justify-between overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000" 
            alt="Register Welcome" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl shadow-inner">🍜</div>
             <span className="text-3xl font-bold tracking-tight text-white">LOG</span>
          </div>
          <div className="relative z-10 mb-10">
            <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Join our <span className="text-orange-400">Culinary</span> Community
            </h2>
            <p className="text-white/80 text-lg max-w-md">Discover the best dishes near you and share your food journey.</p>
          </div>
        </div>

        {/* 右侧：注册表单 */}
        {/* 📱 适配点 4：手机端宽度 100% (w-full)，电脑端 50% (lg:w-1/2)；内边距手机小 (p-8)，电脑大 (lg:p-16) */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 bg-white/60">
          <div className="max-w-md mx-auto">
            
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 transition-colors mb-8 font-semibold text-sm group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              Back to Home
            </Link>

            {/* 📱 适配点 5：调整标题和副标题的字号和间距 */}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight mb-2 lg:mb-3">Create Account</h1>
            <p className="text-sm lg:text-base text-stone-600 mb-8 lg:mb-10">Sign up in seconds to personalize your food recommendations.</p>
            
            {/* 📱 适配点 6：缩紧手机端表单元素的间距 space-y-5 */}
            <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2 px-1">Username</label>
                <input 
                  type="text" name="userName" value={formData.userName} onChange={handleChange} required 
                  className="w-full px-5 lg:px-6 py-3.5 lg:py-4 rounded-full bg-white border border-stone-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none transition text-sm lg:text-base" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2 px-1">Email Address</label>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleChange} required 
                  className="w-full px-5 lg:px-6 py-3.5 lg:py-4 rounded-full bg-white border border-stone-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none transition text-sm lg:text-base" 
                />
              </div>

              {/* 📱 适配点 7：密码输入框。手机端改为单列 (grid-cols-1)，平板以上才恢复双列 (sm:grid-cols-2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 px-1">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-5 lg:px-6 py-3.5 lg:py-4 rounded-full bg-white border border-stone-200 focus:ring-2 focus:ring-orange-300 outline-none transition text-sm lg:text-base" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 px-1">Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-5 lg:px-6 py-3.5 lg:py-4 rounded-full bg-white border border-stone-200 focus:ring-2 focus:ring-orange-300 outline-none transition text-sm lg:text-base" />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200/70">
                <h3 className="text-base lg:text-lg font-bold text-stone-800 mb-1">Set Your Initial Preferences</h3>
                <p className="text-xs text-stone-500 mb-4 lg:mb-5">(You can change these anytime in settings)</p>
                
                {/* 📱 适配点 8：偏好设置下拉框。手机端改为单列 (grid-cols-1)，平板以上恢复双列 (sm:grid-cols-2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-4">
                  {/* 美食下拉框 */}
                  <div className="relative" ref={cuisineRef}>
                    <label className="block text-sm font-bold text-stone-700 mb-2 px-1">Favorite Cuisine</label>
                    <div 
                      onClick={() => setIsCuisineOpen(!isCuisineOpen)}
                      className={`w-full px-4 lg:px-5 py-3 lg:py-3.5 rounded-full border cursor-pointer flex items-center gap-3 transition-all ${isCuisineOpen ? 'bg-amber-50 border-amber-300 shadow-inner' : 'bg-white border-stone-200 hover:border-amber-200'}`}
                    >
                      <span className="text-xl">{currentCuisine?.icon}</span>
                      <span className="font-semibold text-sm text-stone-800 flex-1">{currentCuisine?.label}</span>
                      <span className={`text-[9px] text-amber-600 transition-transform ${isCuisineOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>

                    {isCuisineOpen && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white border border-stone-100 rounded-2xl shadow-xl p-2 z-50 max-h-52 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                        {cuisineOptions.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => { setFormData({...formData, cuisine: item.id}); setIsCuisineOpen(false); }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-colors ${formData.cuisine === item.id ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-amber-50 hover:text-amber-700'}`}
                          >
                            <span className="text-xl">{item.icon}</span>
                            {item.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 距离下拉框 */}
                  <div className="relative" ref={distanceRef}>
                    <label className="block text-sm font-bold text-stone-700 mb-2 px-1">Max Distance</label>
                    <div 
                      onClick={() => setIsDistanceOpen(!isDistanceOpen)}
                      className={`w-full px-4 lg:px-5 py-3 lg:py-3.5 rounded-full border cursor-pointer flex items-center gap-3 transition-all ${isDistanceOpen ? 'bg-teal-50 border-teal-300 shadow-inner' : 'bg-white border-stone-200 hover:border-teal-200'}`}
                    >
                      <span className="text-xl">🏃‍♂️</span>
                      <span className="font-semibold text-sm text-stone-800 flex-1">{currentDistance?.label}</span>
                      <span className={`text-[9px] text-teal-600 transition-transform ${isDistanceOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>

                    {isDistanceOpen && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white border border-stone-100 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        {distanceOptions.map((item) => (
                          <div 
                            key={item.value}
                            onClick={() => { setFormData({...formData, distance: item.value}); setIsDistanceOpen(false); }}
                            className={`flex items-center px-4 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-colors ${formData.distance === item.value ? 'bg-teal-100 text-teal-900' : 'text-stone-600 hover:bg-teal-50 hover:text-teal-700'}`}
                          >
                            {item.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 lg:py-4 rounded-full font-bold text-base lg:text-lg hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 mt-6 lg:mt-8 shadow-[0_10px_20px_-5px_rgba(249,115,22,0.3)]"
              >
                Create Account ✨
              </button>
            </form>

            <p className="text-center text-stone-600 mt-8 text-sm">
              Already have an account? <Link to="/login" className="text-orange-600 font-bold hover:text-orange-700 underline underline-offset-2">Sign In here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;