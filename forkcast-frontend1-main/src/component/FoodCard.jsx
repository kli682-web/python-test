import React from 'react';

// 🌟 核心升级：增加一个 mealType 的 prop，用来显示类型标签
export default function FoodCard({ name, distance, price, suggestion, image, mealType }) {
  
  // 设置一个绝对大气且稳定的默认图片
  const defaultMainImage = "https://images.unsplash.com/photo-1540420773420-3366772f51aa?w=600";

  return (
    // 卡片外层布局：大气、高级、柔和
    <div className="group bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-[0_12px_48px_rgba(0,0,0,0.02)] flex flex-col md:flex-row overflow-hidden hover:border-orange-100 hover:bg-white transition-all duration-300 transform hover:-translate-y-1">
      
      {/* 🌟 核心修复与升级：大气、矩形的图片区域（占据左侧/顶部） */}
      <div className="w-full md:w-60 md:h-auto h-48 shrink-0 relative overflow-hidden">
        <img 
          src={image || defaultMainImage} 
          alt={name} 
          // 使用 object-cover 让图片填满，并保持比例。鼠标滑过时有轻微放大效果。
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        {/* 在图片上加一层超级微妙的暖色渐变，统一氛围 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/10 via-transparent to-transparent opacity-60"></div>
      </div>
      
      {/* 🌟 核心修复：文字内容佈局重新设计 */}
      <div className="flex-1 p-8 flex flex-col justify-between gap-6">
        
        {/* 顶部：店铺信息与核心升级 */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            {/* 🌟 核心升级：这里显示动态的 mealType (Main, Drinks, Snacks...) 
                 色彩鲜明大气 */}
            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full tracking-wider uppercase">
              {mealType}
            </span>
            
            {/* 价格：大气、鲜明色块 */}
            <div className="px-3.5 py-1.5 bg-orange-50 border border-orange-100 rounded-full shrink-0">
              <span className="text-xl font-black text-orange-600">
                ${price}
              </span>
              <span className="text-sm font-bold text-orange-400">/set</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            {/* 餐廳名稱：字體更大更清晰 */}
            <h3 className="flex-1 text-2xl font-extrabold text-stone-900 truncate tracking-tight">{name}</h3>
            
            <div className="flex items-center gap-1.5 shrink-0 bg-stone-50 px-2.5 py-1 rounded-full text-xs font-medium text-stone-500">
                📍 within {distance} sector
            </div>
          </div>
        </div>

        {/* 🌟 AI 建议区域：保持你喜欢的卡片内层样式，但布局更宽敞 */}
        <div className="bg-[#fcf9f2] p-6 rounded-3xl border border-stone-100 shadow-inner relative overflow-hidden group">
          <div className="absolute top-2.5 right-3.5 text-2xl opacity-10 group-hover:opacity-100 transition-opacity">💡</div>
          <p className="text-stone-600 text-[13px] font-medium leading-relaxed relative z-10 pr-6">
            {suggestion}
          </p>
        </div>

      </div>

    </div>
  );
}