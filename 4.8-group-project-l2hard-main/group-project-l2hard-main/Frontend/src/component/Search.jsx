import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Search({ budget, setBudget, cuisine, setCuisine, distance, setDistance }) {
  const navigate = useNavigate();

  const cuisineOptions = [
    { id: "salad", icon: "🥗", label: "Salad" },
    { id: "burger", icon: "🍔", label: "Burger" },
    { id: "sandwich", icon: "🥪", label: "Sandwich" },
    { id: "pizza", icon: "🍕", label: "Pizza" },
    { id: "sushi", icon: "🍣", label: "Sushi" },
    { id: "pasta", icon: "🍝", label: "Pasta" },
    { id: "dessert", icon: "🍰", label: "Dessert" },
    { id: "drinks", icon: "🍹", label: "Drinks" },
    { id: "noodles", icon: "🍜", label: "Noodles" }
  ];

  const distanceOptions = [
    { value: "5", label: "Within 5 min" },
    { value: "10", label: "Within 10 min" },
    { value: "15", label: "Within 15 min" },
    { value: "20", label: "Within 20 min" },
    { value: "25", label: "Within 25 min" },
    { value: "30", label: "Within 30 min" }
  ];

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

  const handleAskAI = () => {
    navigate('/chat', {
      state: { budget, cuisine, distance }
    });
  };

  const currentCuisineIcon = cuisineOptions.find(c => c.id === cuisine.toLowerCase())?.icon || "🍽️";
  const currentDistanceLabel = distanceOptions.find(d => d.value === distance)?.label || "Distance";

  return (
    // 🛠️ 终极方案：移动端采用 grid-cols-2 (2x2网格)，高度减半！边缘使用 rounded-[1.75rem] 更圆滑
    <div className="w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[1.75rem] lg:rounded-[2.5rem] p-2.5 lg:p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] grid grid-cols-2 lg:flex lg:flex-row items-center gap-2.5 lg:gap-3 box-border">
      
      {/* 1. Cuisine 选项 (位于左上角) */}
      <div className="relative col-span-1 lg:w-48 min-w-0" ref={cuisineRef}>
        <div 
          onClick={() => setIsCuisineOpen(!isCuisineOpen)}
          className={`w-full h-12 lg:h-14 px-3 lg:px-6 bg-amber-50 rounded-2xl lg:rounded-full border ${isCuisineOpen ? 'border-amber-300 shadow-inner' : 'border-amber-100'} flex items-center justify-between gap-1 lg:gap-3 cursor-pointer hover:bg-white hover:border-amber-200 transition-all select-none`}
        >
          <div className="flex items-center gap-1.5 lg:gap-3 min-w-0">
            <span className="text-lg lg:text-2xl shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-110">{currentCuisineIcon}</span>
            <span className="font-extrabold text-stone-800 capitalize text-[13px] lg:text-sm truncate">{cuisine}</span>
          </div>
          <span className={`text-[9px] text-amber-600 shrink-0 transition-transform duration-300 ${isCuisineOpen ? 'rotate-180' : ''}`}>▲</span>
        </div>

        {/* 下拉菜单统一改为向上弹出 (bottom-[calc(100%+8px)])，防止被下方元素遮挡 */}
        {isCuisineOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 w-[160px] lg:w-48 bg-white/95 backdrop-blur-xl border border-stone-100 rounded-[1.25rem] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <ul className="flex flex-col gap-1 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              {cuisineOptions.map((item) => (
                <li 
                  key={item.id}
                  onClick={() => { setCuisine(item.id); setIsCuisineOpen(false); }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer font-bold text-[13px] lg:text-sm transition-all duration-200
                    ${cuisine.toLowerCase() === item.id 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'text-stone-600 hover:bg-amber-50 hover:text-amber-600'}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Distance 选项 (位于右上角) */}
      <div className="relative col-span-1 lg:w-56 min-w-0" ref={distanceRef}>
        <div 
          onClick={() => setIsDistanceOpen(!isDistanceOpen)}
          className={`w-full h-12 lg:h-14 px-3 lg:px-6 bg-teal-50 rounded-2xl lg:rounded-full border ${isDistanceOpen ? 'border-teal-300 shadow-inner' : 'border-teal-100'} flex items-center justify-between gap-1 lg:gap-3 cursor-pointer hover:bg-white hover:border-teal-200 transition-all select-none`}
        >
          <div className="flex items-center gap-1.5 lg:gap-3 min-w-0">
            <span className="text-lg lg:text-2xl shrink-0 drop-shadow-sm">📍</span>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[9px] lg:text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-0.5 hidden lg:block">Distance</span>
              <span className="font-extrabold text-stone-800 text-[13px] lg:text-xs truncate">{currentDistanceLabel}</span>
            </div>
          </div>
          <span className={`text-[9px] text-teal-600 shrink-0 transition-transform duration-300 ${isDistanceOpen ? 'rotate-180' : ''}`}>▲</span>
        </div>

        {isDistanceOpen && (
          <div className="absolute bottom-[calc(100%+8px)] right-0 w-[180px] lg:w-56 bg-white/95 backdrop-blur-xl border border-stone-100 rounded-[1.25rem] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <ul className="flex flex-col gap-1 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              {distanceOptions.map((item) => (
                <li 
                  key={item.value}
                  onClick={() => { setDistance(item.value); setIsDistanceOpen(false); }}
                  className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer font-bold text-[13px] lg:text-sm transition-all duration-200
                    ${distance === item.value 
                      ? 'bg-teal-100 text-teal-800' 
                      : 'text-stone-600 hover:bg-teal-50 hover:text-teal-600'}`}
                >
                  <span className="mr-2 opacity-50 text-base">🏃‍♂️</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Budget 滑块区域 (位于左下角) */}
      <div className="col-span-1 lg:flex-1 h-12 lg:h-14 px-3 lg:px-6 bg-orange-50 rounded-2xl lg:rounded-full border border-orange-100 flex items-center gap-2 lg:gap-6 hover:bg-white hover:border-orange-200 transition-colors min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
             <span className="text-lg lg:text-2xl drop-shadow-sm">💰</span>
             <span className="hidden lg:inline font-bold text-sm text-stone-500 uppercase tracking-wider">Budget</span>
             <span className="text-orange-600 font-black text-[14px] lg:text-xl">${budget}</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="100" 
            value={budget} 
            onChange={(e) => setBudget(e.target.value)} 
            className="flex-1 w-full min-w-0 h-1.5 lg:h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-orange-500 hover:accent-orange-600 transition-all" 
          />
      </div>

      {/* 4. Ask AI 按钮 (位于右下角) */}
      <button 
        onClick={handleAskAI}
        className="col-span-1 lg:w-auto h-12 lg:h-14 px-3 lg:px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl lg:rounded-full font-bold text-[14px] lg:text-lg hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 lg:gap-2 shrink-0 shadow-[0_10px_20px_-5px_rgba(249,115,22,0.3)] min-w-0"
      >
        <span className="text-lg lg:text-xl shrink-0">✨</span>
        <span className="truncate">Ask AI</span>
      </button>
      
    </div>
  );
}