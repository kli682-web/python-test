import { useMemo, useState } from 'react'; 
import Navbar from '../component/Navbar'; 
import Search from '../component/Search';
import FoodCard from '../component/FoodCard';

const mains = [
  { id: 'm1', type: 'Main Dish', name: 'Premium Wagyu Steak', price: 25, cuisineEmoji: '🥩', imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800', suggestion: 'Indulge in a premium choice, perfectly aged.' },
  { id: 'm2', type: 'Main Dish', name: "Sector's Finest Ramen", price: 15, cuisineEmoji: '🍜', imageUrl: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800', suggestion: 'Hearty and perfectly within the UoA Sector vibes.' },
  { id: 'm3', type: 'Main Dish', name: 'Classic Cheeseburger', price: 10, cuisineEmoji: '🍔', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', suggestion: 'A quick and delicious bite on a budget.' },
];

const drinks = [
  { id: 'd1', type: 'Drinks', name: 'Vintage Wine Glass', price: 10, cuisineEmoji: '🍷', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800', suggestion: 'Elegant pairing for a nice meal.' },
  { id: 'd2', type: 'Drinks', name: 'The Keg: Craft Lager', price: 5, cuisineEmoji: '🍺', imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800', suggestion: 'Refreshing draft lager. Perfect companion.' },
];

const desserts = [
  { id: 'ds1', type: 'Dessert', name: 'Classic Tiramisu', price: 8, cuisineEmoji: '🍰', imageUrl: 'https://images.unsplash.com/photo-1571115177098-24c42de1bd0f?w=800', suggestion: 'A rich Italian finish to your meal.' },
  { id: 'ds2', type: 'Dessert', name: 'Vanilla Ice Cream', price: 4, cuisineEmoji: '🍦', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=800', suggestion: 'Simple, cooling, and sweet.' },
];

const buildOffersForBudget = (budget) => {
  const targetBudget = Number(budget);
  let bestCombo = [];
  let minDiff = Infinity;
  const optionalDrinks = [...drinks, { price: 0, isNone: true }];
  const optionalDesserts = [...desserts, { price: 0, isNone: true }];

  mains.forEach((main) => {
    optionalDrinks.forEach((drink) => {
      optionalDesserts.forEach((dessert) => {
        const total = main.price + drink.price + dessert.price;

        if (total > targetBudget) {
          return;
        }

        const diff = targetBudget - total;
        if (diff < minDiff) {
          minDiff = diff;
          const combo = [{ ...main, distance: '300m' }];

          if (!drink.isNone) combo.push({ ...drink, distance: '450m' });
          if (!dessert.isNone) combo.push({ ...dessert, distance: '200m' });

          bestCombo = combo;
        }
      });
    });
  });

  if (bestCombo.length > 0) {
    return bestCombo;
  }

  return [...mains, ...drinks, ...desserts]
    .filter((item) => item.price <= targetBudget)
    .map((item, index) => ({ ...item, distance: '100m', id: `single-${index}` }));
};

export default function Homepage() {
  const [budget, setBudget] = useState(15);
  const [cuisine, setCuisine] = useState('Salad'); 
  const [distance, setDistance] = useState('1');
  const currentOffers = useMemo(() => buildOffersForBudget(budget), [budget]);

  return (
    // 1. 锁死全屏外框，绝对不允许任何溢出发生
    <div className="fixed inset-0 flex flex-col md:flex-row w-full overflow-hidden bg-[#fdf5e6]">

      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/menu-bg.png"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          alt="bg"
        />
      </div>

      <Navbar />

      {/* 2. 🔴 修复 Bug 的核心位置 🔴：
          加上 min-h-0 和 overflow-hidden。这告诉浏览器：“即使里面的卡片有 1 万张，你这个 main 容器的高度也不能超过屏幕高度！” */}
      <main className="flex-1 flex flex-col relative h-full min-w-0 min-h-0 overflow-hidden z-10">

        {/* 3. 滚动区域：flex-1 (占据除搜索框外所有剩余空间) + overflow-y-auto (负责内部滚动) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-12 custom-scrollbar z-10">
          <div className="max-w-4xl mx-auto pb-4">

            <div className="mb-6 md:mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-stone-800">Hi there! 👋</h2>
              <p className="text-sm md:text-base text-stone-500 font-medium mt-1">Let's find your perfect meal around UoA.</p>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif text-stone-800 italic leading-tight mb-8 md:mb-12">
              "I have <span className="text-orange-600 font-bold">${budget}</span> <br className="hidden sm:block" /> 
              and want a <span className="text-orange-600 font-bold">{cuisine}</span>."
            </h1>

            <div className="flex flex-col gap-6 md:gap-8 relative z-10">
              {currentOffers.length > 0 ? (
                currentOffers.map((offer) => (
                  <FoodCard 
                    key={offer.id} 
                    name={offer.name} 
                    distance={offer.distance} 
                    price={offer.price}
                    suggestion={offer.suggestion}
                    image={offer.imageUrl} 
                    mealType={offer.type}  
                  />
                ))
              ) : (
                <div className="text-orange-700 font-bold p-8 md:p-10 bg-orange-50/90 border border-orange-200 rounded-2xl md:rounded-3xl shadow-sm text-center backdrop-blur-sm transition-all">
                  <span className="text-2xl md:text-3xl block mb-2 md:mb-3">🥺</span>
                  Budget might be too low. Try increasing it!
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 4. 底部搜索框：shrink-0 (绝对不允许被压缩)。
            它作为正常的流式元素跟在滚动区域下面，从此告别 absolute 绝对定位带来的高度计算混乱！*/}
        <div className="shrink-0 w-full p-4 pb-8 md:p-8 bg-white/85 backdrop-blur-2xl border-t border-orange-100/80 shadow-[0_-20px_50px_rgba(249,115,22,0.1)] z-50">
          <Search 
            budget={budget} setBudget={setBudget}
            cuisine={cuisine} setCuisine={setCuisine}
            distance={distance} setDistance={setDistance}
          />
        </div>

      </main>
    </div>
  );
}