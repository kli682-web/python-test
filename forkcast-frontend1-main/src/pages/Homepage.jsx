import { useState } from 'react';
import Navbar from '../component/Navbar'; 
import Search from '../component/Search';
import FoodCard from '../component/FoodCard';

export default function Homepage() {
  const [budget, setBudget] = useState(15);
  const [cuisine, setCuisine] = useState('Salad'); // 默认大写，更正式
  const [distance, setDistance] = useState('1');

  // 🌟 1. 重构 Mock 数据数组：按类型定义，并更新了第一张拉面图为绝对稳定的链接
  const currentOffers = [
    {
      id: 1,
      // 🌟 类型 1：主食 (Main Dish)
      type: "Main Dish",
      name: "Sector's Finest Ramen",
      distance: "300m",
      price: "18.5",
      cuisineEmoji: "🍜", // 这个决定常亮图标
      // 🌟 全新换上的绝对稳定、高颜值的拉面图片链接，色彩鲜明大气
      imageUrl: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800", // 绝对稳定
      suggestion: "Hearty and perfectly within the UoA Sector vibes. Best for a proper lunch."
    },
    {
      id: 2,
      // 🌟 类型 2：饮料啤酒 (Drinks & Beer) - 保持色彩鲜明的精酿啤酒图片
      type: "Drinks & Beer",
      name: "The Keg: Craft Lager",
      distance: "450m",
      price: "12.0",
      cuisineEmoji: "🍺",
      imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800", // 绝对稳定
      suggestion: "Refreshing draft lager. Perfect companion after a busy day on campus."
    },
    {
      id: 3,
      // 🌟 类型 3：小吃甜品 (Snacks & Desserts) - 保持你最喜欢的Cafe图
      type: "Snacks & Desserts",
      name: "Pastry Heaven: Croissant",
      distance: "150m",
      price: "7.5",
      cuisineEmoji: "🥐",
      imageUrl: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&auto=format&fit=crop", 
      suggestion: "Delicate and warm. Great for a quick bite between lectures."
    }
  ];

  // 🌟 2. 彻底简化图标逻辑：让它“常亮”
  // 永远只取列表第一项（主食）的 Emoji
  const permanentEmoji = currentOffers.length > 0 ? currentOffers[0].cuisineEmoji : "🍽️";

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      
      {/* 背景图 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1490818387583-1b0ba6871347?w=1600')` }}
      >
        <div className="absolute inset-0 bg-[#fcf9f2]/90 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 flex h-full w-full">
        <Navbar />
        
        <main className="flex-1 flex flex-col h-full min-w-0">
          
          <div className="flex-1 overflow-y-auto p-12 relative custom-scrollbar">
            
            {/* 🌟 3. 就是这里！常亮图标。透明度提高到 0.2，看起来非常大气且“常亮” */}
            <div 
              className="absolute top-10 right-10 text-[15rem] opacity-20 select-none pointer-events-none transition-all duration-300"
            >
              {permanentEmoji}
            </div>

            <div className="max-w-4xl mx-auto">
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-stone-800">Hi there! 👋</h2>
                <p className="text-stone-500 font-medium mt-1">Let's find your perfect meal around UoA.</p>
              </div>

              <h1 className="text-5xl font-serif text-stone-800 italic leading-tight mb-12">
                "I have <span className="text-orange-600">${budget}</span> <br /> 
                and want a <span className="text-orange-600">{cuisine}</span>."
              </h1>

              {/* 使用 .map() 动态渲染多个 FoodCard */}
              <div className="flex flex-col gap-6 mb-32 relative z-10">
                {currentOffers.map((offer) => (
                  <FoodCard 
                    key={offer.id} 
                    name={offer.name} 
                    distance={offer.distance} 
                    price={offer.price}
                    suggestion={offer.suggestion}
                    image={offer.offerTypeImageUrl || offer.imageUrl} // 传给 FoodCard 
                    mealType={offer.type}  // 传给 FoodCard 用来显示类型
                  />
                ))}
              </div>

            </div>
          </div>

          <div className="p-8 bg-[#fcf9f2]/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20 relative">
            <Search 
              budget={budget} setBudget={setBudget}
              cuisine={cuisine} setCuisine={setCuisine}
              distance={distance} setDistance={setDistance}
            />
          </div>
          
        </main>
      </div>
    </div>
  );
}