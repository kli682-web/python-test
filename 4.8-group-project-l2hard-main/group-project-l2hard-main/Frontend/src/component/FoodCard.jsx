import React from 'react';
import { FOOD_CARD_BACKGROUND_SRC } from '../constants/foodCard.js';

export default function FoodCard({ name, distance, price, suggestion, image, mealType }) {
  const defaultMainImage = FOOD_CARD_BACKGROUND_SRC;

  return (
    <div
      // 📱 适配点 1：手机端圆角缩小为 rounded-2xl，增加悬浮时的暖色阴影
      className="group flex transform flex-col overflow-hidden rounded-2xl md:rounded-3xl border border-white/40 bg-white/85 bg-cover bg-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 hover:bg-white md:flex-row"
      style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.9)), url('${FOOD_CARD_BACKGROUND_SRC}')` }}
    >
      {/* 📱 适配点 2：图片高度在手机上设为 h-40 防止过长，平板设为 h-48，电脑端恢复自适应 h-auto */}
      <div className="w-full md:w-60 md:h-auto h-40 sm:h-48 shrink-0 relative overflow-hidden">
        <img 
          src={image || defaultMainImage} 
          alt={name} 
          // 📱 图片圆角：手机端只有上方圆角 (rounded-t-2xl)，电脑端只有左侧圆角 (md:rounded-l-3xl md:rounded-tr-none)
          className="w-full h-full object-cover rounded-t-2xl md:rounded-l-3xl md:rounded-tr-none transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/10 via-transparent to-transparent opacity-60"></div>
      </div>
      
      {/* 📱 适配点 3：内边距在手机上缩小为 p-5，间距缩小为 gap-4 */}
      <div className="flex-1 p-5 md:p-8 flex flex-col justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
            <span className="text-[10px] md:text-[11px] font-bold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-full tracking-wider uppercase shadow-sm">
              {mealType}
            </span>
            <div className="px-3 py-1 md:px-3.5 md:py-1.5 bg-orange-50 border border-orange-100 rounded-full shrink-0 shadow-sm">
              <span className="text-lg md:text-xl font-black text-orange-600">
                ${price}
              </span>
              <span className="text-xs md:text-sm font-bold text-orange-400">/set</span>
            </div>
          </div>
          
          {/* 📱 适配点 4：标题排版。如果手机屏幕过窄，标题和距离标签会自动上下折行排布 (flex-col sm:flex-row) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1">
            <h3 className="flex-1 text-xl md:text-2xl font-extrabold text-stone-900 truncate tracking-tight">{name}</h3>
            <div className="inline-flex self-start sm:self-auto items-center gap-1.5 shrink-0 bg-stone-50 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold text-stone-500 border border-stone-200">
                📍 within {distance} sector
            </div>
          </div>
        </div>

        {/* 📱 适配点 5：底部建议框的内边距和圆角也跟随屏幕缩小 */}
        <div className="bg-[#fcf9f2] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-stone-100 shadow-inner relative overflow-hidden group/tip">
          <div className="absolute top-2 right-3 text-2xl opacity-10 group-hover/tip:opacity-100 transition-opacity duration-300">💡</div>
          <p className="text-stone-600 text-xs md:text-[13px] font-medium leading-relaxed relative z-10 pr-6">
            {suggestion}
          </p>
        </div>

      </div>

    </div>
  );
}