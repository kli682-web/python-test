const STOP_WORDS = new Set([
  'i', 'me', 'my', 'want', 'would', 'like', 'to', 'eat', 'have', 'get', 'give', 'show',
  'need', 'some', 'a', 'an', 'the', 'for', 'with', 'and', 'or', 'please', 'hi', 'hello',
  'hey', 'suggestion', 'suggest', 'recommend', 'recommendation', 'recommendations',
  'do', 'you', 'any', 'can', 'could', 'something', 'im', 'i\'m', 'am', 'just', 'only',
  'maybe', 'about', 'around', 'wanting', 'looking', 'looking for', 'craving'
]);

const CUISINE_SYNONYMS = {
  japanese: ['japanese', 'japan', 'japanese food', 'japanese cuisine', 'japanese meal'],
  korean: ['korean', 'korea', 'korean food', 'korean cuisine'],
  chinese: ['chinese', 'china', 'chinese food', 'chinese cuisine'],
  thai: ['thai', 'thai food', 'thai cuisine'],
  vietnamese: ['vietnamese', 'viet', 'vietnamese food', 'vietnamese cuisine'],
  malaysian: ['malaysian', 'malay', 'malaysian food'],
  indian: ['indian', 'indian food', 'indian cuisine'],
  western: ['western', 'western food', 'western cuisine'],
  mexican: ['mexican', 'mexican food', 'mexican cuisine'],
  italian: ['italian', 'italian food', 'italian cuisine'],
  healthy: ['healthy food', 'healthy meal']
};

const BROAD_CATEGORY_SYNONYMS = {
  drink: ['drink', 'drinks', 'beverage', 'beverages', 'something to drink'],
  snack: ['snack', 'snacks', 'small bite', 'small bites', 'finger food', 'something small'],
  meal: ['meal', 'main meal', 'main dish', 'lunch', 'dinner', 'food']
};

const MODIFIER_SYNONYMS = {
  fried: ['fried', 'deep fried', 'crispy', 'crunchy', 'greasy', 'oily', 'fried stuff'],
  refreshing: ['refreshing', 'fresh', 'light', 'cool', 'not heavy', 'easy to eat', 'not oily'],
  healthy: ['healthy', 'clean eating', 'nutritious', 'low calorie', 'high protein', 'diet friendly', 'healthy option'],
  hot: ['hot', 'warm', 'something warm', 'warm food', 'hot meal'],
  cold: ['cold', 'iced', 'chilled', 'cool food'],
  spicy: ['spicy', 'chilli', 'chili', 'hot spicy', 'with heat', 'strong flavour', 'strong flavor'],
  sweet: ['sweet', 'dessert-like', 'sugary', 'something sweet'],
  filling: ['filling', 'heavy', 'big meal', 'full meal', 'substantial', 'something solid']
};

const NON_SPECIFIC_TYPES = new Set(['unknown', 'combo', 'addon', 'drink', 'snack', 'food', 'side']);
const DRINK_TYPES = new Set(['bubble_tea', 'smoothie', 'coffee', 'tea', 'drink']);
const SIDE_LIKE_TYPES = new Set(['fries', 'dessert', 'bun', 'dumpling']);

const TYPE_SYNONYMS = {
  burger: ['burger', 'hamburger', 'cheeseburger', 'beef burger', 'chicken burger'],
  noodles: ['noodle', 'noodles', 'ramen', 'udon', 'soba', 'pho', 'vermicelli'],
  pasta: ['pasta', 'spaghetti', 'fettuccine', 'lasagne', 'lasagna'],
  rice: ['rice', 'fried rice', 'rice bowl', 'rice meal', 'donburi'],
  salad: ['salad', 'greens', 'veggie bowl', 'vegetable bowl', 'healthy bowl'],
  sushi: ['sushi', 'maki', 'nigiri', 'sushi roll'],
  wrap: ['wrap', 'roll wrap'],
  sandwich: ['sandwich', 'toastie'],
  pizza: ['pizza', 'slice'],
  soup: ['soup', 'broth', 'miso soup'],
  bento: ['bento', 'bento box'],
  bowl: ['bowl', 'rice bowl', 'poke bowl'],
  box: ['box', 'lunch box'],
  dumpling: ['dumpling', 'dumplings', 'wonton'],
  bun: ['bun', 'bao', 'steamed bun'],
  fries: ['fries', 'chips', 'french fries', 'hot chips'],
  dessert: ['dessert', 'cake', 'pastry', 'ice cream', 'pudding', 'sweet treat'],
  bubble_tea: ['bubble tea', 'milk tea', 'boba', 'boba tea', 'pearl milk tea'],
  tea: ['tea', 'green tea', 'black tea', 'iced tea', 'hot tea', 'lemon tea'],
  coffee: ['coffee', 'latte', 'flat white', 'espresso', 'cappuccino', 'americano', 'iced coffee'],
  smoothie: ['smoothie', 'smoothies', 'juice blend']
};

const MODIFIER_TO_TYPES = {
  fried: ['fries', 'bun', 'burger', 'dumpling'],
  refreshing: ['salad', 'smoothie', 'bubble_tea', 'tea', 'noodles'],
  healthy: ['salad', 'smoothie', 'wrap', 'rice', 'soup'],
  hot: ['noodles', 'soup', 'rice', 'tea', 'coffee'],
  cold: ['bubble_tea', 'smoothie', 'tea', 'salad'],
  spicy: ['noodles', 'rice', 'burger', 'dumpling'],
  sweet: ['dessert', 'bubble_tea', 'tea', 'smoothie'],
  filling: ['rice', 'burger', 'noodles', 'pasta', 'bento', 'box']
};

const CUISINE_TO_FALLBACK_TYPES = {
  japanese: ['sushi', 'rice', 'noodles', 'bento', 'tea'],
  korean: ['rice', 'noodles', 'soup', 'burger'],
  chinese: ['rice', 'noodles', 'dumpling', 'bun'],
  thai: ['rice', 'noodles', 'soup', 'tea'],
  vietnamese: ['noodles', 'rice', 'sandwich', 'coffee'],
  malaysian: ['rice', 'noodles', 'tea'],
  indian: ['rice', 'wrap', 'tea'],
  western: ['burger', 'pasta', 'pizza', 'fries', 'coffee'],
  mexican: ['wrap', 'rice', 'burger'],
  italian: ['pasta', 'pizza', 'coffee'],
  healthy: ['salad', 'smoothie', 'wrap', 'rice']
};

const normalizeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[$,]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value = '') => normalizeText(value).split(/\s+/).filter(Boolean);
const unique = (items = []) => [...new Set(items.filter(Boolean))];
const humanizeType = (value = '') => String(value || '').replace(/_/g, ' ');
const canonicalizeType = (value = '') => String(value || '').trim().toLowerCase().replace(/\s+/g, '_');

const escapeRegExp = (value = '') => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containsPhrase = (text = '', phrase = '') => new RegExp(`(^|\\s)${escapeRegExp(phrase)}(?=\\s|$)`, 'i').test(text);

const extractBudgetDetails = (text = '') => {
  const patterns = [
    { regex: /\b(?:under|below|less than|within)\s*\$?\s*(\d+(?:\.\d+)?)\b/i, operator: 'under' },
    { regex: /\b(?:max(?:imum)?|no more than|up to)\s*\$?\s*(\d+(?:\.\d+)?)\b/i, operator: 'max' },
    { regex: /\b(?:around|about)\s*\$?\s*(\d+(?:\.\d+)?)\b/i, operator: 'around' },
    { regex: /\b(?:budget(?: is)?|have|only have|can spend)\s*\$?\s*(\d+(?:\.\d+)?)\b/i, operator: 'exact' },
    { regex: /\b(?:total budget|budget total)\s*\$?\s*(\d+(?:\.\d+)?)\b/i, operator: 'exact_total' },
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:in total|total|altogether|all up)\b/i, operator: 'exact_total' },
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:for|with)\b/i, operator: 'exact' },
    { regex: /^\s*(\d+(?:\.\d+)?)(?=\s|$)/i, operator: 'exact' },
    { regex: /\$\s*(\d+(?:\.\d+)?)\b/i, operator: 'exact' },
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:dollars|dollar|bucks|nzd)\b/i, operator: 'exact' }
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      return {
        amount: Number(match[1]),
        operator: pattern.operator,
        raw: match[0],
      };
    }
  }

  return null;
};

const getDatasetTypeStats = (dataset = {}) => {
  const stats = new Map();
  const cuisineToTypes = new Map();
  const items = Array.isArray(dataset?.availableMenuItems) ? dataset.availableMenuItems : [];

  items.forEach((item) => {
    const rawTypes = unique([
      item.primaryDishType,
      ...(Array.isArray(item.dishTypes) ? item.dishTypes : []),
      item.normalizedCategory,
    ].map((value) => canonicalizeType(value)).filter(Boolean));

    rawTypes.forEach((type) => {
      const current = stats.get(type) || { count: 0, drinkCount: 0, foodCount: 0 };
      current.count += 1;
      if (item.supportsDrinkIntent) current.drinkCount += 1;
      if (item.supportsFoodIntent) current.foodCount += 1;
      stats.set(type, current);

      const cuisines = unique([...(item.cuisineTags || []), ...(item.restaurantCuisineTypes || []), ...(item.restaurantDerivedCuisineTypes || [])]
        .map((value) => normalizeText(value))
        .filter(Boolean));
      cuisines.forEach((cuisine) => {
        const cuisineMap = cuisineToTypes.get(cuisine) || new Map();
        cuisineMap.set(type, (cuisineMap.get(type) || 0) + 1);
        cuisineToTypes.set(cuisine, cuisineMap);
      });
    });
  });

  return { stats, cuisineToTypes };
};

const buildTypeLexicon = (dataset = {}) => {
  const { stats, cuisineToTypes } = getDatasetTypeStats(dataset);
  const availableTypes = [...stats.keys()].filter((type) => type && !NON_SPECIFIC_TYPES.has(type));
  const specificTypes = availableTypes.filter((type) => stats.get(type)?.count > 0);

  const aliasesByType = new Map();
  specificTypes.forEach((type) => {
    const baseAliases = unique([
      humanizeType(type),
      type,
      ...(TYPE_SYNONYMS[type] || []),
    ].map((value) => normalizeText(value)).filter(Boolean));
    aliasesByType.set(type, baseAliases);
  });

  const commonFoodTypes = [...specificTypes]
    .filter((type) => !DRINK_TYPES.has(type))
    .sort((a, b) => (stats.get(b)?.count || 0) - (stats.get(a)?.count || 0));

  const commonDrinkTypes = [...specificTypes]
    .filter((type) => DRINK_TYPES.has(type))
    .sort((a, b) => (stats.get(b)?.count || 0) - (stats.get(a)?.count || 0));

  const cuisineOptions = {};
  [...Object.keys(CUISINE_TO_FALLBACK_TYPES), ...cuisineToTypes.keys()].forEach((cuisine) => {
    const dynamic = cuisineToTypes.get(cuisine)
      ? [...cuisineToTypes.get(cuisine).entries()]
          .filter(([type]) => specificTypes.includes(type))
          .sort((a, b) => b[1] - a[1])
          .map(([type]) => type)
      : [];
    cuisineOptions[cuisine] = unique([
      ...dynamic,
      ...(CUISINE_TO_FALLBACK_TYPES[cuisine] || []).filter((type) => specificTypes.includes(type)),
    ]).slice(0, 4);
  });

  return {
    stats,
    specificTypes,
    commonFoodTypes,
    commonDrinkTypes,
    aliasesByType,
    cuisineOptions,
  };
};

const detectCanonicalTypes = (normalizedTextValue = '', lexicon) => {
  const candidates = [];
  for (const [type, aliases] of lexicon.aliasesByType.entries()) {
    aliases.forEach((alias) => {
      if (containsPhrase(normalizedTextValue, alias)) {
        candidates.push({ type, aliasLength: alias.length });
      }
    });
  }

  return unique(
    candidates
      .sort((a, b) => b.aliasLength - a.aliasLength)
      .map((entry) => entry.type)
  );
};

const detectFromSynonymMap = (normalizedTextValue = '', map = {}) =>
  unique(
    Object.entries(map)
      .filter(([, phrases]) => phrases.some((phrase) => containsPhrase(normalizedTextValue, normalizeText(phrase))))
      .map(([key]) => key)
  );

const buildOptionsForBroadCategory = ({ broadCategory, cuisines = [], lexicon }) => {
  if (broadCategory === 'drink') return lexicon.commonDrinkTypes.slice(0, 4);
  if (broadCategory === 'snack') {
    return ['fries', 'dessert', 'bun', 'dumpling'].filter((type) => lexicon.specificTypes.includes(type)).slice(0, 4);
  }
  const cuisineOption = cuisines[0] && lexicon.cuisineOptions[cuisines[0]]?.length
    ? lexicon.cuisineOptions[cuisines[0]]
    : [];

  if (cuisineOption.length) return cuisineOption.slice(0, 4);
  return lexicon.commonFoodTypes.slice(0, 4);
};

const buildOptionsForModifiers = ({ modifiers = [], lexicon }) => {
  const options = modifiers.flatMap((modifier) => MODIFIER_TO_TYPES[modifier] || []);
  return unique(options.filter((type) => lexicon.specificTypes.includes(type))).slice(0, 4);
};

const buildGenericOptions = (lexicon) => unique([...lexicon.commonFoodTypes, ...lexicon.commonDrinkTypes]).slice(0, 5);

const isGenericMessage = (value = '') => {
  const normalized = normalizeText(value);
  if (!normalized) return true;
  return [
    'hi', 'hello', 'hey', 'recommend', 'recommendation', 'recommendations',
    'give me recommendation', 'give me recommendations', 'give me suggestion',
    'suggest', 'suggestions', 'any suggestion', 'what do you recommend'
  ].includes(normalized);
};

const isGreetingOnly = (value = '') => {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return [
    'hi', 'hello', 'hey', 'hello there', 'hi there', 'hey there', 'good morning', 'good afternoon', 'good evening'
  ].includes(normalized);
};

const hasTotalBudgetLanguage = (value = '') => /(in total|total|altogether|all up|for both|for all|combined|together)/i.test(String(value || ''));
const hasComboJoiner = (value = '') => /(and|with|plus)/i.test(String(value || ''));
const hasDrinkWord = (value = '') => /(drink|drinks|tea|coffee|smoothie|bubble tea|boba|milk tea|juice|lemon tea)/i.test(String(value || ''));

const mergeUnique = (...arrays) => unique(arrays.flat().filter(Boolean));

export const buildConversationContext = (messages = []) =>
  messages
    .filter((message) => message?.role === 'user' && typeof message?.content === 'string')
    .map((message) => String(message.content || '').trim())
    .filter((content) => content && !isGenericMessage(content))
    .slice(-8)
    .join(' ');


const findLatestBudgetDetailsFromMessages = (messages = [], dataset) => {
  const userMessages = messages
    .filter((message) => message?.role === 'user' && typeof message?.content === 'string')
    .map((message) => String(message.content || '').trim())
    .filter(Boolean)
    .reverse();

  for (const content of userMessages) {
    const parsed = parseQuery(content, { dataset });
    if (parsed.budgetMentioned) {
      return parsed.budgetDetails;
    }
  }

  return null;
};

export const parseConversationQuery = ({ latestMessage = '', messages = [], dataset } = {}) => {
  const conversationContext = buildConversationContext(messages);
  const baseQuery = parseQuery(latestMessage || conversationContext || '', { dataset });

  if (!conversationContext || normalizeText(conversationContext) === normalizeText(latestMessage || '')) {
    return baseQuery;
  }

  const contextQuery = parseQuery(conversationContext, { dataset });
  const combinedRaw = [conversationContext, latestMessage].filter(Boolean).join(' ');
  const resolvedFoodTypes = mergeUnique(contextQuery.requestedFoods, baseQuery.requestedFoods);
  const resolvedDrinkTypes = mergeUnique(contextQuery.requestedDrinks, baseQuery.requestedDrinks);
  const resolvedTypes = mergeUnique(contextQuery.requestedDishTerms, baseQuery.requestedDishTerms);
  const cuisines = mergeUnique(contextQuery.cuisines, baseQuery.cuisines);
  const modifiers = mergeUnique(contextQuery.modifiers, baseQuery.modifiers);
  const broadCategories = mergeUnique(contextQuery.broadCategories, baseQuery.broadCategories);
  const budgetDetails = baseQuery.budgetMentioned ? baseQuery.budgetDetails : (findLatestBudgetDetailsFromMessages(messages, dataset) || contextQuery.budgetDetails);
  const budgetMentioned = Boolean(budgetDetails && Number.isFinite(Number(budgetDetails.amount)));
  const budget = budgetMentioned ? Number(budgetDetails.amount) : null;
  const explicitTotalBudget = budgetDetails?.operator === 'exact_total' || hasTotalBudgetLanguage(combinedRaw);
  const comboRequested = contextQuery.isComboRequest || baseQuery.isComboRequest || hasDrinkWord(combinedRaw) && hasComboJoiner(combinedRaw);
  const budgetScope = explicitTotalBudget || comboRequested ? 'total' : 'item';
  const hasComboSignal = comboRequested || (resolvedFoodTypes.length > 0 && (resolvedDrinkTypes.length > 0 || broadCategories.includes('drink')));
  const hasResolvedType = resolvedTypes.length > 0;
  const needsDrinkTypeForCombo = hasComboSignal && resolvedFoodTypes.length > 0 && resolvedDrinkTypes.length === 0;
  const needsFoodTypeForCombo = hasComboSignal && resolvedDrinkTypes.length > 0 && resolvedFoodTypes.length === 0;
  const hasIncompleteCombo = needsDrinkTypeForCombo || needsFoodTypeForCombo;

  let intent = 'general';
  if (hasComboSignal && resolvedFoodTypes.length > 0 && resolvedDrinkTypes.length > 0) intent = 'combo';
  else if (isGreetingOnly(latestMessage || conversationContext) && !budgetMentioned && !hasResolvedType) intent = 'greeting';
  else if (resolvedDrinkTypes.length > 0 && !resolvedFoodTypes.length) intent = 'drink';
  else if (resolvedFoodTypes.length > 0) intent = 'food';
  else if (broadCategories.includes('drink')) intent = 'drink';
  else if (broadCategories.includes('meal') || cuisines.length || modifiers.length) intent = 'food';

  const foodTypeStatus = hasResolvedType
    ? 'resolved'
    : broadCategories.length || cuisines.length
      ? 'broad'
      : modifiers.length
        ? 'modifier_only'
        : 'missing';

  let clarificationMode = null;
  if (baseQuery.intent === 'greeting' && !hasResolvedType && !budgetMentioned) {
    clarificationMode = 'greeting';
  } else if (budgetMentioned && !hasResolvedType) {
    clarificationMode = foodTypeStatus === 'broad' ? 'broad_food_type' : foodTypeStatus === 'modifier_only' ? 'modifier_only' : 'missing_food_type';
  } else if (!budgetMentioned && hasResolvedType && !hasIncompleteCombo) {
    clarificationMode = 'missing_budget';
  } else if (needsDrinkTypeForCombo) {
    clarificationMode = 'missing_drink_type';
  } else if (needsFoodTypeForCombo) {
    clarificationMode = 'missing_food_type';
  } else if (!budgetMentioned && !hasResolvedType) {
    clarificationMode = foodTypeStatus === 'broad' ? 'broad_food_type' : foodTypeStatus === 'modifier_only' ? 'modifier_only' : 'missing_both';
  }

  const shouldRecommend = budgetMentioned && (hasComboSignal
    ? resolvedFoodTypes.length > 0 && resolvedDrinkTypes.length > 0 && !hasIncompleteCombo
    : hasResolvedType);

  let clarificationOptions = [];

  if (clarificationMode === 'broad_food_type') {
    clarificationOptions = baseQuery.clarificationOptions || contextQuery.clarificationOptions || [];
  } else if (clarificationMode === 'modifier_only') {
    clarificationOptions = baseQuery.clarificationOptions || contextQuery.clarificationOptions || [];
  } else if (clarificationMode === 'missing_budget' && hasResolvedType) {
    clarificationOptions = ['under $10', 'under $15', 'under $20'];
  } else {
    clarificationOptions = contextQuery.clarificationOptions?.length ? contextQuery.clarificationOptions : baseQuery.clarificationOptions;
  }

  return {
    ...baseQuery,
    raw: latestMessage || baseQuery.raw,
    normalized: baseQuery.normalized,
    budget,
    budgetDetails,
    budgetMentioned,
    budgetScope,
    intent,
    cuisines,
    cuisine: cuisines[0] || null,
    modifiers,
    broadCategory: broadCategories[0] || null,
    broadCategories,
    dishTypes: resolvedFoodTypes,
    requestedFoods: resolvedFoodTypes,
    requestedDrinks: resolvedDrinkTypes,
    requestedDishTerms: resolvedTypes,
    resolvedFoodType: resolvedTypes[0] || null,
    resolvedFoodTypes: resolvedTypes,
    foodTypeStatus,
    isComboRequest: hasComboSignal,
    explicitTotalBudget,
    needsDrinkTypeForCombo,
    needsFoodTypeForCombo,
    wantsFood: intent === 'food' || intent === 'combo',
    wantsDrink: intent === 'drink' || intent === 'combo',
    shouldRecommend,
    shouldClarify: !shouldRecommend,
    clarificationMode,
    clarificationOptions,
    requiresMainDish: intent === 'food' && resolvedFoodTypes.some((type) => !SIDE_LIKE_TYPES.has(type)),
    shouldAskBudget: !budgetMentioned,
    conversationContext,
  };
};

export const parseQuery = (rawMessage = '', { dataset } = {}) => {
  const raw = String(rawMessage || '').trim();
  const normalized = normalizeText(raw);
  const tokens = tokenize(raw);
  const keywords = tokens.filter((token) => !STOP_WORDS.has(token));
  const budgetDetails = extractBudgetDetails(raw);
  const budget = budgetDetails?.amount ?? null;
  const budgetMentioned = Boolean(budgetDetails && Number.isFinite(Number(budgetDetails.amount)));
  const lexicon = buildTypeLexicon(dataset);

  const cuisines = detectFromSynonymMap(normalized, CUISINE_SYNONYMS);
  const broadCategories = detectFromSynonymMap(normalized, BROAD_CATEGORY_SYNONYMS);
  if (cuisines.length && !broadCategories.includes('meal')) broadCategories.unshift('meal');
  const modifiers = detectFromSynonymMap(normalized, MODIFIER_SYNONYMS);
  const resolvedTypes = detectCanonicalTypes(normalized, lexicon);

  const resolvedFoodTypes = resolvedTypes.filter((type) => !DRINK_TYPES.has(type));
  const resolvedDrinkTypes = resolvedTypes.filter((type) => DRINK_TYPES.has(type));

  const comboJoinerPresent = hasComboJoiner(normalized);
  const explicitTotalBudget = budgetDetails?.operator === 'exact_total' || hasTotalBudgetLanguage(raw);
  const comboRequested = (comboJoinerPresent && (resolvedFoodTypes.length > 0 || resolvedDrinkTypes.length > 0 || broadCategories.includes('drink'))) || (hasDrinkWord(raw) && comboJoinerPresent);
  const hasComboSignal = comboRequested && (resolvedFoodTypes.length > 0 || resolvedDrinkTypes.length > 0 || broadCategories.includes('drink'));
  const hasResolvedType = resolvedTypes.length > 0;
  const needsDrinkTypeForCombo = hasComboSignal && resolvedFoodTypes.length > 0 && resolvedDrinkTypes.length === 0;
  const needsFoodTypeForCombo = hasComboSignal && resolvedDrinkTypes.length > 0 && resolvedFoodTypes.length === 0;
  const hasIncompleteCombo = needsDrinkTypeForCombo || needsFoodTypeForCombo;

  let intent = 'general';
  if (hasComboSignal && resolvedFoodTypes.length > 0 && resolvedDrinkTypes.length > 0) intent = 'combo';
  else if (isGreetingOnly(raw) && !budgetMentioned && !hasResolvedType) intent = 'greeting';
  else if (resolvedDrinkTypes.length > 0 && !resolvedFoodTypes.length) intent = 'drink';
  else if (resolvedFoodTypes.length > 0) intent = 'food';
  else if (broadCategories.includes('drink')) intent = 'drink';
  else if (broadCategories.includes('meal') || cuisines.length || modifiers.length) intent = 'food';

  const foodTypeStatus = hasResolvedType
    ? 'resolved'
    : broadCategories.length || cuisines.length
      ? 'broad'
      : modifiers.length
        ? 'modifier_only'
        : 'missing';

  let clarificationMode = null;
  if (intent === 'greeting') {
    clarificationMode = 'greeting';
  } else if (budgetMentioned && !hasResolvedType) {
    clarificationMode = foodTypeStatus === 'broad' ? 'broad_food_type' : foodTypeStatus === 'modifier_only' ? 'modifier_only' : 'missing_food_type';
  } else if (!budgetMentioned && hasResolvedType && !hasIncompleteCombo) {
    clarificationMode = 'missing_budget';
  } else if (needsDrinkTypeForCombo) {
    clarificationMode = 'missing_drink_type';
  } else if (needsFoodTypeForCombo) {
    clarificationMode = 'missing_food_type';
  } else if (!budgetMentioned && !hasResolvedType) {
    clarificationMode = foodTypeStatus === 'broad' ? 'broad_food_type' : foodTypeStatus === 'modifier_only' ? 'modifier_only' : 'missing_both';
  }

  const shouldRecommend = budgetMentioned && (
    hasComboSignal
      ? resolvedFoodTypes.length > 0 && resolvedDrinkTypes.length > 0 && !hasIncompleteCombo
      : hasResolvedType
  );

  let clarificationOptions = [];
  if (clarificationMode === 'broad_food_type') {
    clarificationOptions = buildOptionsForBroadCategory({ broadCategory: broadCategories[0] || 'meal', cuisines, lexicon });
  } else if (clarificationMode === 'modifier_only') {
    clarificationOptions = buildOptionsForModifiers({ modifiers, lexicon });
  } else {
    clarificationOptions = buildGenericOptions(lexicon);
  }

  if (clarificationMode === 'missing_budget' && hasResolvedType) {
    clarificationOptions = ['under $10', 'under $15', 'under $20'];
  }

  return {
    raw,
    normalized,
    tokens,
    keywords,
    budget,
    budgetDetails,
    budgetMentioned,
    budgetScope: explicitTotalBudget || comboRequested ? 'total' : 'item',
    intent,
    cuisines,
    cuisine: cuisines[0] || null,
    proteins: [],
    dishTypes: resolvedFoodTypes,
    requestedFoods: resolvedFoodTypes,
    requestedDrinks: resolvedDrinkTypes,
    requestedDishTerms: resolvedTypes,
    resolvedFoodType: resolvedTypes[0] || null,
    resolvedFoodTypes: resolvedTypes,
    broadCategory: broadCategories[0] || null,
    broadCategories,
    modifiers,
    foodTypeStatus,
    isComboRequest: hasComboSignal,
    explicitTotalBudget,
    needsDrinkTypeForCombo,
    needsFoodTypeForCombo,
    wantsFood: intent === 'food' || intent === 'combo',
    wantsDrink: intent === 'drink' || intent === 'combo',
    shouldRecommend,
    shouldClarify: !shouldRecommend,
    clarificationMode,
    clarificationOptions: clarificationOptions.map(humanizeType),
    lexiconSummary: {
      specificTypes: lexicon.specificTypes,
      commonFoodTypes: lexicon.commonFoodTypes,
      commonDrinkTypes: lexicon.commonDrinkTypes,
    },
    requiresMainDish: intent === 'food' && resolvedFoodTypes.some((type) => !SIDE_LIKE_TYPES.has(type)),
    hard_constraints: {
      excludeAddon: true,
    },
    shouldAskBudget: !budgetMentioned,
  };
};
