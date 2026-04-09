import { useState, useEffect } from 'react'; 
import Navbar from '../component/Navbar'; 
import Search from '../component/Search';
import FoodCard from '../component/FoodCard';


export default function Homepage() {
  const [budget, setBudget] = useState(15);
  const [cuisine, setCuisine] = useState('Salad'); 
  const [distance, setDistance] = useState('1');
  

  // 🟢 1. 核心修改：将原本静态的 currentOffers 变成状态，方便随 budget 动态更新
  const [currentOffers, setCurrentOffers] = useState([]);
  
  // 🟢 2. 核心修改：引入 selectedOfferId 状态，用来管理哪个 FoodCard 被选中。满足你选取时有左边图标的需求。
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  // 🟢 3. 核心修改：使用 useEffect 监听 budget 的变化，动态计算 Main+Drink+Dessert 组合
  // (这里模拟从 MongoDB 获取数据并进行穷举匹配，接入后端时只需 fetch(`/api/recommend?budget=${budget}`) 并 set 结果)
  useEffect(() => {
    const targetBudget = Number(budget);

    // 🟢 4. 模拟数据库：加入 Main, Drinks, Dessert 三类数据
    const mains = [
      { id: 'm1', type: "Main Dish", name: "Premium Wagyu Steak", price: 25, cuisineEmoji: "🥩", imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800", suggestion: "Indulge in a premium choice, perfectly aged." },
      { id: 'm2', type: "Main Dish", name: "Sector's Finest Ramen", price: 15, cuisineEmoji: "🍜", imageUrl: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800", suggestion: "Hearty and perfectly within the UoA Sector vibes." },
      { id: 'm3', type: "Main Dish", name: "Classic Cheeseburger", price: 10, cuisineEmoji: "🍔", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", suggestion: "A quick and delicious bite on a budget." }
    ];

    const drinks = [
      { id: 'd1', type: "Drinks", name: "Vintage Wine Glass", price: 10, cuisineEmoji: "🍷", imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800", suggestion: "Elegant pairing for a nice meal." },
      { id: 'd2', type: "Drinks", name: "The Keg: Craft Lager", price: 5, cuisineEmoji: "🍺", imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800", suggestion: "Refreshing draft lager. Perfect companion." }
    ];

    const desserts = [
      { id: 'ds1', type: "Dessert", name: "Classic Tiramisu", price: 8, cuisineEmoji: "🍰", imageUrl: "https://images.unsplash.com/photo-1571115177098-24c42de1bd0f?w=800", suggestion: "A rich Italian finish to your meal." },
      { id: 'ds2', type: "Dessert", name: "Vanilla Ice Cream", price: 4, cuisineEmoji: "🍦", imageUrl: "https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=800", suggestion: "Simple, cooling, and sweet." }
    ];

    let bestCombo = [];
    let minDiff = Infinity;

    // 为了允许组合中缺少饮料或甜点（例如：只吃主食），我们在可选列表中加入“无 (价格为0)”的选项
    const optionalDrinks = [...drinks, { price: 0, isNone: true }];
    const optionalDesserts = [...desserts, { price: 0, isNone: true }];

    // 🟢 5. 匹配算法：穷举 Mains × OptionalDrinks × OptionalDesserts，寻找最接近 Budget 的组合
    mains.forEach(main => {
      optionalDrinks.forEach(drink => {
        optionalDesserts.forEach(dessert => {
          const total = main.price + drink.price + dessert.price;
          
          if (total <= targetBudget) {
            const diff = targetBudget - total;
            if (diff < minDiff) {
              minDiff = diff; 
              
              // 组装最终结果，排查掉 "无" 的选项
              const combo = [{ ...main, distance: "300m" }];
              if (!drink.isNone) combo.push({ ...drink, distance: "450m" });
              if (!dessert.isNone) combo.push({ ...dessert, distance: "200m" });
              
              bestCombo = combo;
            }
          }
        });
      });
    });

    // 🟢 6. 更新当前推荐列表：如果有最佳组合则渲染，否则提供预算内单品兜底
    if (bestCombo.length > 0) {
      setCurrentOffers(bestCombo);
      // 默认选中第一个主食卡片
      setSelectedOfferId(bestCombo[0].id);
    } else {
      const affordable = [...mains, ...drinks, ...desserts].filter(item => item.price <= targetBudget);
      setCurrentOffers(affordable.map((item, index) => ({ ...item, distance: "100m", id: `single-${index}` })));
      // 如果没有最佳组合，则不默认选中
      setSelectedOfferId(null);
    }
  }, [budget]);

  // 获取背景常亮 Emoji
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
          
          {/* 🟢 修改点：优化列表区域排版和整体间距 */}
          <div className="flex-1 overflow-y-auto p-12 relative custom-scrollbar z-10">
            
            {/* 常亮图标 */}
            <div className="absolute top-10 right-10 text-[15rem] opacity-20 select-none pointer-events-none transition-all duration-300">
              {permanentEmoji}
            </div>

            <div className="max-w-4xl mx-auto">
              
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-stone-800">Hi there! 👋</h2>
                <p className="text-stone-500 font-medium mt-1">Let's find your perfect meal around UoA.</p>
              </div>

              {/* 🟢 修改点：标题使用更高级、更暖的 Serif 字体和更柔和的橙色 */}
              <h1 className="text-5xl font-serif text-stone-800 italic leading-tight mb-12">
                "I have <span className="text-orange-600 font-bold">${budget}</span> <br /> 
                and want a <span className="text-orange-600 font-bold">{cuisine}</span>."
              </h1>

              {/* 使用 .map() 动态渲染多个 FoodCard */}
              {/* 🟢 修改点：优化整体间距，并在没有推荐时渲染一个更好看的提示框 */}
              <div className="flex flex-col gap-8 mb-32 relative z-10">
                {currentOffers.length > 0 ? (
                  currentOffers.map((offer) => (
                    // 🟢 7. 核心修改：传递 isSelected prop 给 FoodCard，通过 id 来判断是否被选中。
                    <FoodCard 
                      key={offer.id} 
                      name={offer.name} 
                      distance={offer.distance} 
                      price={offer.price}
                      suggestion={offer.suggestion}
                      image={offer.imageUrl} 
                      mealType={offer.type}  
                      isSelected={offer.id === selectedOfferId}
                    />
                  ))
                ) : (
                   <div className="text-stone-500 font-bold p-10 bg-white/50 border border-stone-100 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.01)] text-center">Budget might be too low to find a combo! Please increase your budget.</div>
                )}
              </div>

            </div>
          </div>

          {/* 搜索栏 */}
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