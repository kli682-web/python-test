import React from 'react';

// 🟢 核心升级：大幅优化 UI 布局，使其更高级、更现代。使用水平排版，小屏幕自动堆叠。
// 🟢 核心升级：增加一个 mealType 的 prop，用来显示类型标签 (Main, Drinks, Dessert)
export default function FoodCard({ name, distance, price, suggestion, image, mealType }) {
  
  // 🟢 核心升级：设置一个更有食欲、更统一的默认图片
  const defaultMainImage = "https://images.unsplash.com/photo-1540420773420-3366772f51aa?w=600";

  return (
    // 🟢 修改点：卡片外层设计为横向布局 (`md:flex-row`)，圆角、微妙阴影和悬停升起效果 (`hover:-translate-y-1`)
    <div className="group bg-white/80 backdrop-blur-md rounded-3xl border border-white/40 shadow-[0_12px_48px_rgba(0,0,0,0.02)] flex flex-col md:flex-row overflow-hidden hover:border-orange-100 hover:bg-white transition-all duration-300 transform hover:-translate-y-1">
      
      {/* 🟢 修改点：图片占据左侧/顶部，增加圆角和轻微的暖色调渐变 */}
      <div className="w-full md:w-60 md:h-auto h-48 shrink-0 relative overflow-hidden">
        <img 
          src={image || defaultMainImage} 
          alt={name} 
          // 🟢 使用 object-cover 让图片填满容器并保持比例，鼠标滑过时有轻微放大效果。
          className="w-full h-full object-cover rounded-3xl md:rounded-l-3xl md:rounded-r-none transition-transform duration-500 group-hover:scale-105" 
        />
        {/* 在图片上加一层微妙的暖色渐变，统一卡片氛围 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/10 via-transparent to-transparent opacity-60"></div>
      </div>
      
      {/* 🟢 修改点：文字内容排版重新设计，间距更宽敞 */}
      <div className="flex-1 p-8 flex flex-col justify-between gap-6">
        
        {/* 顶部：店铺信息与核心升级 */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            {/* 🟢 核心升级：这里显示动态的 mealType (Main Dish, Drinks, Dessert) 
                 标签色彩鲜明，Uppercase 字体更醒目 */}
            <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-full tracking-wider uppercase">
              {mealType}
            </span>
            
            {/* 价格：大气、鲜明的色块，突出数字 */}
            <div className="px-3.5 py-1.5 bg-orange-50 border border-orange-100 rounded-full shrink-0">
              <span className="text-xl font-black text-orange-600">
                ${price}
              </span>
              <span className="text-sm font-bold text-orange-400">/set</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            {/* 餐厅名称：字体更大更清晰，增加粗细对比 */}
            <h3 className="flex-1 text-2xl font-extrabold text-stone-900 truncate tracking-tight">{name}</h3>
            
            {/* 📍 核心修改：重新设计距离标签 */}
            <div className="flex items-center gap-1.5 shrink-0 bg-stone-50 px-2.5 py-1 rounded-full text-xs font-medium text-stone-500">
                📍 within {distance} sector
            </div>
          </div>
        </div>

        {/* 🟢 AI 建议区域：独立出一个小卡片区域，背景色更柔和，布局更宽敞 */}
        <div className="bg-[#fcf9f2] p-6 rounded-3xl border border-stone-100 shadow-inner relative overflow-hidden group">
          {/* 右上角的💡图标，仅在鼠标滑过时高亮 */}
          <div className="absolute top-2.5 right-3.5 text-2xl opacity-10 group-hover:opacity-100 transition-opacity">💡</div>
          <p className="text-stone-600 text-[13px] font-medium leading-relaxed relative z-10 pr-6">
            {suggestion}
          </p>
        </div>

      </div>

    </div>
  );
}