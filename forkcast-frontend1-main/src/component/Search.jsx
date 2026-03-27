export default function Search({ budget, setBudget, cuisine, setCuisine, distance, setDistance }) {
  const categories = ["salad", "burger", "sandwich", "pizza", "sushi", "pasta","dessert", "drinks","noodles"];

  return (
    <div className="w-full max-w-5xl mx-auto bg-white/40 backdrop-blur-xl border border-white/30 rounded-full p-2 flex items-center shadow-2xl transition-all hover:bg-white/50">
      
      {/* 1. Cuisine Selection (左侧固定) */}
      <div className="px-6 border-r border-gray-300/30">
        <select 
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="bg-transparent font-bold text-stone-700 outline-none cursor-pointer hover:text-orange-600 transition-colors capitalize text-sm"
        >
          {categories.map((item) => (
            <option key={item} value={item} className="bg-white text-stone-800">
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Budget Range (中间滑动) */}
      <div className="flex-[1.5] px-8 flex items-center gap-4 border-r border-gray-300/30">
        <label className="font-bold text-sm text-stone-700 whitespace-nowrap">
          Budget: <span className="text-orange-600">${budget}</span>
        </label>
        <input 
          type="range" 
          min="5" 
          max="100" 
          value={budget} 
          onChange={(e) => setBudget(e.target.value)} 
          className="w-full h-1.5 bg-stone-200 rounded-lg accent-orange-500 cursor-pointer appearance-none" 
        />
      </div>

      {/* 3. 新增的 Distance Range (右侧选择) */}
      <div className="flex-1 px-6 flex items-center gap-2 group">
        <span className="text-stone-400 group-hover:text-orange-500 transition-colors">📍</span>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter leading-none">Distance</label>
          <select 
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="bg-transparent font-bold text-stone-700 outline-none cursor-pointer hover:text-orange-600 transition-colors text-sm"
          >
            <option value="5">Within 5 min</option>
            <option value="10">Within 10 min</option>
            <option value="15">Within 15 min</option>
            <option value="20">Within 20 min</option>
            <option value="25">Within 25 min</option>
            <option value="30">Within 30 min</option>
          </select>
        </div>
      </div>

      {/* 4. Action Button */}
      <button className="bg-orange-500 text-white px-10 py-3.5 rounded-full font-bold hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-200">
        Ask AI
      </button>
      
    </div>
  );
}