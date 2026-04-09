const normalizeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value = '') => normalizeText(value).split(' ').filter(Boolean);

const unique = (values = []) => [...new Set(values.filter(Boolean))];

const PROTEIN_RULES = {
  beef: ['beef', 'steak', 'bulgogi', 'brisket', 'gyudon', 'angus'],
  chicken: ['chicken', 'karaage', 'teriyaki'],
  pork: ['pork', 'bacon', 'ham', 'char siu', 'char', 'siu'],
  lamb: ['lamb'],
  fish: ['fish', 'salmon', 'tuna', 'eel'],
  seafood: ['seafood', 'shrimp', 'prawn', 'mussel', 'squid', 'octopus'],
  vegetarian: ['vegan', 'vegetarian', 'tofu', 'veggie', 'falafel'],
};

const CUISINE_RULES = {
  japanese: ['japanese', 'ramen', 'udon', 'don', 'teriyaki', 'karaage', 'miso'],
  chinese: ['chinese', 'sichuan', 'dumpling', 'wonton', 'bao', 'steamed bun', 'fried rice'],
  korean: ['korean', 'kimchi', 'bulgogi', 'bibimbap'],
  thai: ['thai', 'tom yum', 'pad thai'],
  vietnamese: ['vietnamese', 'banh', 'pho'],
  italian: ['italian', 'pasta', 'pizza', 'marinara'],
  indian: ['indian', 'curry', 'masala', 'naan'],
  mexican: ['mexican', 'burrito', 'taco'],
  healthy: ['healthy', 'salad', 'smoothie', 'wrap'],
};

const DISH_RULES = [
  { type: 'bubble_tea', terms: ['bubble tea', 'boba'] },
  { type: 'smoothie', terms: ['smoothie'] },
  { type: 'coffee', terms: ['coffee'] },
  { type: 'tea', terms: ['tea'] },
  { type: 'salad', terms: ['salad'] },
  { type: 'noodles', terms: ['noodle', 'noodles', 'ramen', 'udon', 'vermicelli', 'pho'] },
  { type: 'pasta', terms: ['pasta', 'spaghetti', 'fettuccine', 'lasagne'] },
  { type: 'pizza', terms: ['pizza'] },
  { type: 'burger', terms: ['burger'] },
  { type: 'wrap', terms: ['wrap'] },
  { type: 'sandwich', terms: ['sandwich'] },
  { type: 'rice', terms: ['rice', 'fried rice'] },
  { type: 'bento', terms: ['bento', 'bento box'] },
  { type: 'box', terms: ['box'] },
  { type: 'bowl', terms: ['bowl'] },
  { type: 'dumpling', terms: ['dumpling', 'dumplings', 'wonton'] },
  { type: 'bun', terms: ['bun', 'bao', 'steamed bun'] },
  { type: 'soup', terms: ['soup', 'miso soup'] },
  { type: 'fries', terms: ['fries', 'chips', 'hash brown'] },
  { type: 'snack', terms: ['cracker', 'nuggets', 'wings', 'shrimp cracker'] },
  { type: 'dessert', terms: ['dessert', 'pudding', 'cake', 'cookie', 'red bean'] },
  { type: 'addon', terms: ['extra', 'add on', 'addon', 'topping', 'sauce', 'olives', 'cheese'] },
  { type: 'combo', terms: ['combo'] },
  { type: 'drink', terms: ['drink', 'juice'] },
];

const MAIN_DISH_TYPES = new Set(['salad', 'noodles', 'pasta', 'pizza', 'burger', 'wrap', 'sandwich', 'rice', 'bento', 'box', 'bowl', 'dumpling', 'bun', 'soup']);
const DRINK_DISH_TYPES = new Set(['bubble_tea', 'smoothie', 'coffee', 'tea', 'drink']);

const includesAny = (text = '', patterns = []) => patterns.some((pattern) => text.includes(pattern));

const extractByRules = (text = '', rules = {}) =>
  Object.entries(rules)
    .filter(([, patterns]) => includesAny(text, patterns))
    .map(([key]) => key);

const extractDishTypes = (text = '') =>
  DISH_RULES.filter((rule) => includesAny(text, rule.terms)).map((rule) => rule.type);

const derivePrimaryDishType = ({ dishTypes = [], isCombo = false, isAddon = false, isSide = false, isDrink = false } = {}) => {
  if (isAddon) return 'addon';
  if (isCombo) return 'combo';
  if (isDrink) return dishTypes.find((type) => DRINK_DISH_TYPES.has(type)) || 'drink';
  if (isSide) return dishTypes.find((type) => type === 'fries' || type === 'snack' || type === 'bun') || 'side';
  return dishTypes.find((type) => MAIN_DISH_TYPES.has(type)) || dishTypes[0] || null;
};

export const normalizeMenuMetadata = (menu = {}, restaurant = {}) => {
  const menuText = normalizeText([menu.name, menu.category].join(' '));
  const rawText = normalizeText([menu.name, menu.category, restaurant.name, ...(restaurant.cuisineTypes || [])].join(' '));
  const dishTypes = unique(extractDishTypes(menuText));
  const proteinTags = unique(extractByRules(menuText, PROTEIN_RULES));
  const cuisineTags = unique([...(restaurant.cuisineTypes || []).map((item) => normalizeText(item)), ...extractByRules(rawText, CUISINE_RULES)]);
  const isAddon = dishTypes.includes('addon') || includesAny(menuText, [' extra ', 'extra ', ' add on', ' addon', ' topping', ' sauce']) || /^(extra|add)/.test(rawText);
  const multiMainSignals = ['rice', 'salad', 'nuggets', 'pudding', 'chips', 'fries', 'drink'].filter((term) => menuText.includes(term)).length;
  const isCombo = dishTypes.includes('combo') || includesAny(menuText, ['combo', 'with drink', 'meal deal', 'bento box']) || (menuText.includes('meal') && multiMainSignals >= 2);
  const drinkLike = dishTypes.some((type) => DRINK_DISH_TYPES.has(type)) || includesAny(menuText, ['smoothie', 'bubble tea', 'coffee', 'juice']);
  const sideLike = !drinkLike && (dishTypes.includes('fries') || dishTypes.includes('snack') || includesAny(menuText, ['hash brown', 'chips', 'fries', 'cracker']));
  const containsSalad = menuText.includes('salad');
  const containsNoodles = includesAny(menuText, ['noodle', 'noodles', 'ramen', 'udon', 'vermicelli', 'pho']);
  const primaryDishType = derivePrimaryDishType({
    dishTypes,
    isCombo,
    isAddon,
    isSide: sideLike,
    isDrink: drinkLike,
  });

  const supportsFoodIntent = !drinkLike || isCombo || MAIN_DISH_TYPES.has(primaryDishType) || sideLike;
  const supportsDrinkIntent = drinkLike;
  const isMainDish = !isAddon && !sideLike && !drinkLike && (isCombo || MAIN_DISH_TYPES.has(primaryDishType));
  const normalizedCategory = primaryDishType || normalizeText(menu.category || 'unknown');

  const mealTags = unique([
    isMainDish ? 'main_dish' : null,
    sideLike ? 'side' : null,
    isAddon ? 'addon' : null,
    isCombo ? 'combo' : null,
    supportsDrinkIntent ? 'drink' : null,
    supportsFoodIntent ? 'food' : null,
  ]);

  const searchText = unique([
    menu.name,
    menu.category,
    restaurant.name,
    ...(restaurant.cuisineTypes || []),
    normalizedCategory,
    primaryDishType,
    ...dishTypes,
    ...proteinTags,
    ...cuisineTags,
  ]).join(' ');

  return {
    normalizedCategory,
    primaryDishType,
    dishTypes,
    proteinTags,
    cuisineTags,
    mealTags,
    isMainDish,
    isSide: sideLike,
    isAddon,
    isCombo,
    includesDrink: isCombo && includesAny(rawText, ['drink', 'tea', 'coffee', 'juice']),
    supportsFoodIntent,
    supportsDrinkIntent,
    containsSalad,
    containsNoodles,
    nameTokens: tokenize([menu.name, menu.category].join(' ')),
    searchText,
  };
};

export const deriveRestaurantMetadata = (restaurant = {}, menuItems = []) => {
  const aggregatedDishTypes = unique(menuItems.flatMap((item) => item.dishTypes || []));
  const aggregatedProteins = unique(menuItems.flatMap((item) => item.proteinTags || []));
  const derivedCuisineTypes = unique([
    ...(restaurant.cuisineTypes || []).map((item) => normalizeText(item)),
    ...menuItems.flatMap((item) => item.cuisineTags || []),
  ]);
  const supportsFood = menuItems.some((item) => item.supportsFoodIntent);
  const supportsDrink = menuItems.some((item) => item.supportsDrinkIntent);

  const searchText = unique([
    restaurant.name,
    restaurant.location?.address,
    ...(restaurant.cuisineTypes || []),
    ...derivedCuisineTypes,
    ...aggregatedDishTypes,
    ...aggregatedProteins,
  ]).join(' ');

  return {
    derivedCuisineTypes,
    derivedFoodTypes: aggregatedDishTypes.filter((type) => !DRINK_DISH_TYPES.has(type) && type !== 'addon'),
    supportsFood,
    supportsDrink,
    menuCategorySummary: unique(menuItems.map((item) => item.normalizedCategory)),
    menuProteinSummary: aggregatedProteins,
    menuDishTypeSummary: aggregatedDishTypes,
    searchText,
  };
};
