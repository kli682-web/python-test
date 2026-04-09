import React, { useState, useRef, useEffect } from 'react';

export default function Search({ budget, setBudget, cuisine, setCuisine, distance, setDistance }) {
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

  const currentCuisineIcon = cuisineOptions.find(c => c.id === cuisine.toLowerCase())?.icon || "🍽️";
  const currentDistanceLabel = distanceOptions.find(d => d.value === distance)?.label || "Distance";

  return (
    <div className="w-full max-w-5xl mx-auto bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-3 flex items-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] gap-3">
      
      {/* 1. Cuisine 自定义高级向上拉出菜单 */}
      <div className="relative shrink-0" ref={cuisineRef}>
        <div 
          onClick={() => setIsCuisineOpen(!isCuisineOpen)}
          className={`h-14 px-6 bg-amber-50 rounded-full border ${isCuisineOpen ? 'border-amber-300 shadow-inner' : 'border-amber-100'} flex items-center gap-3 cursor-pointer hover:bg-white hover:border-amber-200 transition-all select-none`}
        >
          <span className="text-2xl drop-shadow-sm transition-transform duration-300 hover:scale-110">{currentCuisineIcon}</span>
          <span className="font-extrabold text-stone-800 capitalize text-sm min-w-[4rem]">{cuisine}</span>
          {/* 🟢 修改点：默认箭头朝上(▲)，点击展开时翻转朝下 */}
          <span className={`text-[10px] text-amber-600 transition-transform duration-300 ${isCuisineOpen ? 'rotate-180' : ''}`}>▲</span>
        </div>

        {/* 🟢 核心修改：将 top-full mt-3 改为 bottom-full mb-3，让菜单向上弹出。并优化了向上的阴影。 */}
        {isCuisineOpen && (
          <div className="absolute bottom-full left-0 mb-3 w-48 bg-white/95 backdrop-blur-xl border border-stone-100 rounded-3xl shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.1)] p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <ul className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {cuisineOptions.map((item) => (
                <li 
                  key={item.id}
                  onClick={() => { setCuisine(item.id); setIsCuisineOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer font-bold text-sm transition-all duration-200
                    ${cuisine.toLowerCase() === item.id 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'text-stone-600 hover:bg-amber-50 hover:text-amber-600'}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Budget 滑块区域 */}
      <div className="flex-1 h-14 px-6 bg-orange-50 rounded-full border border-orange-100 flex items-center gap-6 shrink-0 hover:bg-white hover:border-orange-200 transition-colors">
          <label className="font-bold text-sm text-stone-500 whitespace-nowrap uppercase tracking-wider flex items-center gap-3 shrink-0">
             <span className="text-2xl drop-shadow-sm">💰</span>
              Budget
              <span className="text-orange-600 font-black text-xl">${budget}</span>
          </label>
          <input 
            type="range" 
            min="5" 
            max="100" 
            value={budget} 
            onChange={(e) => setBudget(e.target.value)} 
            className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-orange-500 hover:accent-orange-600 transition-all mr-2" 
          />
      </div>

      {/* 3. Distance 自定义高级向上拉出菜单 */}
      <div className="relative shrink-0" ref={distanceRef}>
        <div 
          onClick={() => setIsDistanceOpen(!isDistanceOpen)}
          className={`h-14 px-6 bg-teal-50 rounded-full border ${isDistanceOpen ? 'border-teal-300 shadow-inner' : 'border-teal-100'} flex items-center gap-3 cursor-pointer hover:bg-white hover:border-teal-200 transition-all select-none`}
        >
          <span className="text-2xl drop-shadow-sm">📍</span>
          <div className="flex flex-col justify-center min-w-[6rem]">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-0.5">Distance</span>
            <span className="font-extrabold text-stone-800 text-xs">{currentDistanceLabel}</span>
          </div>
          {/* 🟢 修改点：默认箭头朝上(▲)，点击展开时翻转朝下 */}
          <span className={`text-[10px] text-teal-600 transition-transform duration-300 ${isDistanceOpen ? 'rotate-180' : ''}`}>▲</span>
        </div>

        {/* 🟢 核心修改：将 top-full mt-3 改为 bottom-full mb-3，让菜单向上弹出。并优化了向上的阴影。 */}
        {isDistanceOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-56 bg-white/95 backdrop-blur-xl border border-stone-100 rounded-3xl shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.1)] p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <ul className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {distanceOptions.map((item) => (
                <li 
                  key={item.value}
                  onClick={() => { setDistance(item.value); setIsDistanceOpen(false); }}
                  className={`flex items-center px-4 py-3 rounded-2xl cursor-pointer font-bold text-sm transition-all duration-200
                    ${distance === item.value 
                      ? 'bg-teal-100 text-teal-800' 
                      : 'text-stone-600 hover:bg-teal-50 hover:text-teal-600'}`}
                >
                  <span className="mr-3 opacity-50">🏃‍♂️</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 4. Ask AI 按钮 */}
      <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white h-14 px-8 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shrink-0 flex items-center gap-2.5 shadow-[0_10px_20px_-5px_rgba(249,115,22,0.3)]">
        <span className="text-xl">✨</span>
        <span>Ask AI</span>
      </button>
      
    </div>
  );
}