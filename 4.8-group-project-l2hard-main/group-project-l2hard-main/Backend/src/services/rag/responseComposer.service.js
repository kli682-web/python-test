/**
 * Formats numeric price as "$XX.XX" string.
 * @param {number|string} value - Price value.
 * @returns {string|null} Formatted price or null if invalid.
 */
const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return `$${number.toFixed(2)}`;
};

/**
 * Checks if value is non-empty/non-null.
 * @param {*} value - Value to check.
 * @returns {boolean} True if has value.
 */
const hasValue = (value) => value !== null && value !== undefined && value !== '';

/**
 * Converts value to array if not already.
 * @param {*} value - Input value.
 * @returns {Array} Array version.
 */
const toArray = (value) => (Array.isArray(value) ? value : []);

/**
 * Gathers all requested food/drink/dish terms from query.
 * @param {Object} query - Parsed query object.
 * @returns {string[]} Combined requested terms.
 */
const getRequestedTerms = (query = {}) => [
  ...toArray(query.requestedFoods),
  ...toArray(query.requestedDrinks),
  ...toArray(query.requestedDishTerms),
  ...toArray(query.requested_dish_terms),
].filter(Boolean);

/**
 * Builds human-readable reason why food candidate matches query.
 * Matches terms, budget, cuisine; falls back to generic.
 * @param {Object} candidate - Menu item candidate.
 * @param {Object} query - Parsed user query.
 * @returns {string} Explanation sentence.
 */
const GENERIC_REASON_PATTERNS = [
  /^budget-friendly[.!]?$/i,
  /^affordable[.!]?$/i,
  /^good option[.!]?$/i,
  /^nice choice[.!]?$/i,
  /^great pick[.!]?$/i,
  /^fits your request[.!]?$/i,
  /^fits your budget[.!]?$/i,
  /^matches your request[.!]?$/i,
];

const getBudgetValue = (query = {}) => {
  const value = Number(query?.budget);
  return Number.isFinite(value) ? value : null;
};

const getCandidateTypes = (candidate = {}) =>
  [candidate.primaryDishType, candidate.normalizedCategory, ...(candidate.dishTypes || [])]
    .filter(Boolean)
    .map((value) => String(value).replace(/_/g, ' ').toLowerCase());

const buildConcreteReasonParts = (candidate = {}, query = {}) => {
  const parts = [];
  const requestedFoodTerms = toArray(query.requestedFoods).map((value) => String(value).replace(/_/g, ' ').toLowerCase());
  const requestedDrinkTerms = toArray(query.requestedDrinks).map((value) => String(value).replace(/_/g, ' ').toLowerCase());
  const requestedTerms = getRequestedTerms(query).map((value) => String(value).replace(/_/g, ' ').toLowerCase());
  const candidateTypes = getCandidateTypes(candidate);
  const lowerText = [candidate.name, candidate.normalizedCategory, ...(candidate.dishTypes || []), ...(candidate.proteinTags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedFoodTerm = requestedFoodTerms.find((term) => lowerText.includes(term) || candidateTypes.includes(term));
  const matchedDrinkTerm = requestedDrinkTerms.find((term) => lowerText.includes(term) || candidateTypes.includes(term));
  const matchedRequestedTerm = requestedTerms.find((term) => lowerText.includes(term) || candidateTypes.includes(term));

  if (matchedFoodTerm) {
    parts.push(`It matches your ${matchedFoodTerm} request directly`);
  } else if (matchedDrinkTerm) {
    parts.push(`It matches the ${matchedDrinkTerm} you asked for`);
  } else if (matchedRequestedTerm) {
    parts.push(`It lines up with the ${matchedRequestedTerm} you asked for`);
  } else if (query.proteins?.length && candidate.proteinTags?.some((tag) => query.proteins.includes(tag))) {
    parts.push(`It matches your ${query.proteins.join('/')} preference`);
  } else if (query.dishTypes?.length && candidate.dishTypes?.some((tag) => query.dishTypes.includes(tag))) {
    parts.push(`It fits the ${query.dishTypes.join('/')} type you asked for`);
  }

  const budget = getBudgetValue(query);
  const price = Number(candidate?.price);
  if (budget !== null && Number.isFinite(price)) {
    if (query?.budgetScope === 'total' && query?.isComboRequest) {
      if (price < budget) {
        parts.push(`It leaves room within your ${formatPrice(budget)} total budget`);
      }
    } else if (price <= budget) {
      parts.push(`It stays within your ${formatPrice(budget)} budget`);
    } else if (price <= budget + 3) {
      parts.push(`It is close to your ${formatPrice(budget)} budget`);
    }
  }

  if (query.cuisines?.length && candidate.cuisineTags?.some((tag) => query.cuisines.includes(tag))) {
    parts.push(`It fits your ${query.cuisines.join('/')} preference`);
  }

  if (Number(candidate.rating) >= 4.3) {
    parts.push(`${candidate.restaurantName || 'The restaurant'} also has a strong rating`);
  } else if (candidate.restaurantName) {
    parts.push(`You can get it from ${candidate.restaurantName}`);
  }

  return parts;
};

const buildFoodReason = (candidate = {}, query = {}) => {
  const parts = buildConcreteReasonParts(candidate, query);
  if (!parts.length) {
    return candidate.restaurantName
      ? `It is one of the closest menu matches I found, and you can get it from ${candidate.restaurantName}.`
      : 'It is one of the closest menu matches I found.';
  }

  return `${parts.slice(0, 2).join('. ')}.`;
};

/**
 * Builds reason for food+drink combo recommendation.
 * @param {Object} foodCandidate - Food item.
 * @param {Object} drinkCandidate - Drink item.
 * @param {Object} query - Query.
 * @returns {string} Combo explanation.
 */
const buildComboReason = (foodCandidate = {}, drinkCandidate = {}, query = {}) => {
  const parts = [];
  const foodType = getCandidateTypes(foodCandidate)[0] || 'food';
  const drinkType = getCandidateTypes(drinkCandidate)[0] || 'drink';
  const total = Number(foodCandidate.price || 0) + Number(drinkCandidate.price || 0);
  const budget = getBudgetValue(query);

  parts.push(`It gives you a ${foodType} plus ${drinkType} combo`);

  if (budget !== null && Number.isFinite(total) && total <= budget) {
    parts.push(`the total stays within your ${formatPrice(budget)} ${query.budgetScope === 'total' ? 'total budget' : 'budget'}`);
  }

  const restaurantNames = [foodCandidate.restaurantName, drinkCandidate.restaurantName]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  if (restaurantNames.length === 1) {
    parts.push(`you can get both from ${restaurantNames[0]}`);
  } else if (restaurantNames.length === 2) {
    parts.push(`it still works across ${restaurantNames[0]} and ${restaurantNames[1]}`);
  }

  return `${parts.join(', ')}.`;
};

const isAcknowledgementOnly = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return true;
  const bareAck = [
    /^got it[,.!\s]*you want .+[.!]?$/i,
    /^okay[,.!\s]*you want .+[.!]?$/i,
    /^you want .+[.!]?$/i,
    /^got it[.!]?$/i,
    /^okay[.!]?$/i,
  ].some((pattern) => pattern.test(normalized));
  return bareAck && !/(here|what|which|try|found|option|budget|drink|food|combo)/i.test(normalized);
};

const isLowQualityReason = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return true;
  if (GENERIC_REASON_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  const meaningfulWords = trimmed.split(/\s+/).filter((token) => token.length > 2);
  return meaningfulWords.length < 4;
};

const repairReason = (reason = '', candidate = {}, query = {}) => {
  if (!isLowQualityReason(reason)) return reason.trim();
  return buildFoodReason(candidate, query);
};

/**
 * Normalizes LLM JSON output, extracts reply/reasons.
 * @param {Object} llmOutput - Raw LLM response.
 * @returns {Object} Normalized {replyText, followUpQuestion, reasonByMenuId}.
 */
const normalizeLlmOutput = (llmOutput = {}) => {
  const recommendations = Array.isArray(llmOutput?.recommendations)
    ? llmOutput.recommendations.filter((item) => item && typeof item === 'object')
    : [];

  const reasonByMenuId = new Map();
  recommendations.forEach((item) => {
    if (!item.menu_id || typeof item.reason !== 'string' || !item.reason.trim()) return;
    reasonByMenuId.set(String(item.menu_id), item.reason.trim());
  });

  return {
    replyText:
      typeof llmOutput?.reply_text === 'string' && llmOutput.reply_text.trim()
        ? llmOutput.reply_text.trim()
        : null,
    followUpQuestion:
      typeof llmOutput?.follow_up_question === 'string' && llmOutput.follow_up_question.trim()
        ? llmOutput.follow_up_question.trim()
        : null,
    reasonByMenuId,
  };
};

/**
 * Builds unique restaurant list with map URLs from candidates.
 * @param {Array} items - Candidates/restaurants.
 * @returns {Array} Deduped restaurant objects.
 */
const buildRestaurantList = (items = []) =>
  items
    .filter(Boolean)
    .map((item) => ({
      name: item.restaurantName || 'Unknown Restaurant',
      mapUrl: item.mapUrl || item.googleMapsUrl || null,
      type: 'restaurant',
    }))
    .filter((item, index, array) => item.mapUrl && array.findIndex((entry) => entry.name === item.name && entry.mapUrl === item.mapUrl) === index);

/**
 * Builds structured recommendation object for single menu item.
 * @param {Object} candidate - Menu candidate.
 * @param {Object} query - User query.
 * @param {Map} llmReasonByMenuId - LLM reasons.
 * @returns {Object} Formatted recommendation.
 */
const buildSingleRecommendation = (candidate, query, llmReasonByMenuId) => ({
  id: String(candidate.id),
  menu_id: String(candidate.id),
  title: candidate.name,
  name: candidate.name,
  price: Number(candidate.price),
  price_breakdown: {
    isCombo: false,
    item1Price: null,
    item2Price: null,
    totalPrice: Number(candidate.price),
    displayText: formatPrice(candidate.price) || 'Price unavailable',
  },
  restaurant_name: candidate.restaurantName || '',
  restaurantName: candidate.restaurantName || '',
  reason: repairReason(llmReasonByMenuId.get(String(candidate.id)) || '', candidate, query),
  evidence: [],
  recommendationType: 'single',
  imageUrl: candidate.imageUrl || null,
  map_url: candidate.mapUrl || candidate.googleMapsUrl || null,
  mapUrl: candidate.mapUrl || candidate.googleMapsUrl || null,
  restaurants: buildRestaurantList([candidate]),
  score: candidate.score,
});

/**
 * Builds structured recommendation for food+drink combo.
 * @param {Object} comboCandidate - Combo {food, drink}.
 * @param {Object} query - Query.
 * @param {Map} llmReasonByMenuId - LLM reasons.
 * @returns {Object} Combo recommendation.
 */
const buildComboRecommendation = (comboCandidate, query, llmReasonByMenuId) => {
  const food = comboCandidate.food;
  const drink = comboCandidate.drink;
  const totalPrice = Number((Number(food?.price || 0) + Number(drink?.price || 0)).toFixed(2));
  const foodReason = llmReasonByMenuId.get(String(food?.id));
  const drinkReason = llmReasonByMenuId.get(String(drink?.id));

  return {
    id: `combo:${food?.id}:${drink?.id}`,
    menu_id: `combo:${food?.id}:${drink?.id}`,
    title: `${food?.name || 'Food'} + ${drink?.name || 'Drink'}`,
    name: `${food?.name || 'Food'} + ${drink?.name || 'Drink'}`,
    price: totalPrice,
    price_breakdown: {
      isCombo: true,
      item1Price: Number(food?.price || 0),
      item2Price: Number(drink?.price || 0),
      totalPrice,
      displayText: `${formatPrice(food?.price) || '$0.00'} + ${formatPrice(drink?.price) || '$0.00'} = ${formatPrice(totalPrice) || '$0.00'}`,
    },
    restaurant_name: [food?.restaurantName, drink?.restaurantName].filter(Boolean).join(' + '),
    restaurantName: [food?.restaurantName, drink?.restaurantName].filter(Boolean).join(' + '),
    reason: (() => {
      const combined = [foodReason, drinkReason].filter(Boolean).join(' ').trim();
      return combined && !isLowQualityReason(combined) ? combined : buildComboReason(food, drink, query);
    })(),
    evidence: [],
    recommendationType: 'combo',
    imageUrl: food?.imageUrl || drink?.imageUrl || null,
    map_url: food?.mapUrl || food?.googleMapsUrl || drink?.mapUrl || drink?.googleMapsUrl || null,
    mapUrl: food?.mapUrl || food?.googleMapsUrl || drink?.mapUrl || drink?.googleMapsUrl || null,
    restaurants: buildRestaurantList([food, drink]),
    items: [food, drink].filter(Boolean),
  };
};

/**
 * Composes final response from retrieval + LLM/fallback.
 * Handles budget ask, no matches, combos, top candidates.
 * @param {Object} query - Parsed query.
 * @param {Array} topMenuCandidates - Top menu items.
 * @param {Object|null} comboCandidate - Best combo.
 * @param {Object|null} llmOutput - LLM response or null.
 * @returns {Object} {reply_text, recommendations, follow_up_question}.
 */
const formatOptions = (options = []) => options.filter(Boolean).slice(0, 5).join(', ');
const humanize = (value = '') => String(value || '').replace(/_/g, ' ');

const buildClarificationResponse = (query = {}) => {
  const optionsText = formatOptions(query.clarificationOptions || []);
  const resolvedFoodText = (query.requestedFoods || []).map(humanize).join(' and ');
  const resolvedDrinkText = (query.requestedDrinks || []).map(humanize).join(' and ');
  const broadLabel = query.cuisine
    ? `${query.cuisine} food`
    : humanize(query.broadCategory || 'food');
  const modifierLabel = (query.modifiers || []).map(humanize).join(' and ');
  const comboSummary = [resolvedFoodText, resolvedDrinkText].filter(Boolean).join(' + ');

  if (query.clarificationMode === 'greeting') {
    return {
      reply_text: 'Hi, I’m Forkcast. I can help with food, drinks, or a combo near campus.',
      recommendations: [],
      follow_up_question: 'Tell me what you feel like eating and your budget, like salad under $15 or salad and lemon tea under $20.',
    };
  }

  if (query.clarificationMode === 'missing_budget') {
    const budgetQuestion = optionsText
      ? `What budget are you aiming for? You can say ${optionsText}.`
      : 'What budget are you aiming for, like under $10, under $15, or under $20?';
    const scopeHint = query.isComboRequest || query.budgetScope === 'total'
      ? ' If that budget is for everything together, I can use it as a total budget.'
      : '';

    return {
      reply_text: `Got it${resolvedFoodText ? `, you want ${resolvedFoodText}` : ''}. ${budgetQuestion}${scopeHint}`.trim(),
      recommendations: [],
      follow_up_question: budgetQuestion,
    };
  }

  if (query.clarificationMode === 'missing_drink_type') {
    return {
      reply_text: `Got it, you want ${resolvedFoodText || 'food'} and a drink.` + (query.budgetMentioned ? ` I also picked up your ${formatPrice(query.budget)} ${query.budgetScope === 'total' ? 'total budget' : 'budget'}.` : ''),
      recommendations: [],
      follow_up_question: optionsText
        ? `What drink do you want with it? You can say ${optionsText}.`
        : 'What drink do you want with it, like lemon tea, coffee, or bubble tea?',
    };
  }

  if (query.clarificationMode === 'broad_food_type') {
    return {
      reply_text: `I can help with that. I still need the exact ${query.broadCategory === 'drink' ? 'drink' : 'food type'} you want.`,
      recommendations: [],
      follow_up_question: optionsText
        ? `You can choose ${optionsText}. Add your budget too if you know it.`
        : 'Tell me the food or drink type you want and your budget.',
    };
  }

  if (query.clarificationMode === 'modifier_only') {
    return {
      reply_text: `Got it, you want something ${modifierLabel || 'like that'}.`,
      recommendations: [],
      follow_up_question: optionsText
        ? `What type do you want? You can choose ${optionsText}. Add your budget too.`
        : 'Tell me the food type you want and your budget.',
    };
  }

  if (query.clarificationMode === 'missing_food_type') {
    return {
      reply_text: resolvedDrinkText
        ? `Got it, you want ${resolvedDrinkText}. I still need the food part.`
        : 'I can help with that.',
      recommendations: [],
      follow_up_question: optionsText
        ? `Tell me the missing food or drink type. You can choose ${optionsText}.`
        : 'Tell me the food or drink type you want, like burger, noodles, salad, coffee, or lemon tea.',
    };
  }

  return {
    reply_text: comboSummary
      ? `I’ve got ${comboSummary} so far.`
      : 'I can help with food, drinks, or a combo.',
    recommendations: [],
    follow_up_question: optionsText
      ? `Tell me the missing detail next. You can choose ${optionsText}.`
      : 'Tell me what you want and your budget, like burger under $15 or salad and lemon tea under $20.',
  };
};

const ensureCompleteReply = ({ replyText, followUpQuestion, recommendations = [], query }) => {
  const safeReply = typeof replyText === 'string' ? replyText.trim() : '';
  const safeFollowUp = typeof followUpQuestion === 'string' ? followUpQuestion.trim() : '';

  if (safeReply && !isAcknowledgementOnly(safeReply)) {
    return { replyText: safeReply, followUpQuestion: safeFollowUp || null };
  }

  if (recommendations.length) {
    const lead = query?.isComboRequest
      ? 'Got it. I found an option that fits your combo request.'
      : `Got it. Here ${recommendations.length === 1 ? 'is an option that fits' : 'are a few options that fit'} what you asked for.`;
    return { replyText: lead, followUpQuestion: safeFollowUp || null };
  }

  if (safeFollowUp) {
    return {
      replyText: safeReply ? `${safeReply} ${safeFollowUp}`.trim() : safeFollowUp,
      followUpQuestion: safeFollowUp,
    };
  }

  const fallbackQuestion = query?.budget
    ? 'Tell me one more detail, like the cuisine or drink you want.'
    : 'Tell me your budget or the exact food or drink type you want.';

  return {
    replyText: safeReply ? `${safeReply} ${fallbackQuestion}`.trim() : fallbackQuestion,
    followUpQuestion: fallbackQuestion,
  };
};

export const composeStructuredResponse = ({
  query,
  topMenuCandidates = [],
  comboCandidate = null,
  llmOutput = null,
}) => {
  if (query.shouldClarify) {
    return buildClarificationResponse(query);
  }

  const normalizedLlm = normalizeLlmOutput(llmOutput);

  if (comboCandidate?.food && comboCandidate?.drink) {
    const recommendations = [buildComboRecommendation(comboCandidate, query, normalizedLlm.reasonByMenuId)];
    const completed = ensureCompleteReply({
      replyText: normalizedLlm.replyText || 'Nice choice. I found a food and drink combo that fits what you asked for.',
      followUpQuestion: normalizedLlm.followUpQuestion || null,
      recommendations,
      query,
    });

    return {
      reply_text: completed.replyText,
      recommendations,
      follow_up_question: completed.followUpQuestion,
    };
  }

  if (!topMenuCandidates.length) {
    const completed = ensureCompleteReply({
      replyText: normalizedLlm.replyText || 'I could not find a strong match yet, but I can narrow it down with one more detail.',
      followUpQuestion:
        normalizedLlm.followUpQuestion ||
        (query.budget
          ? 'Try adding a cuisine, food type, or drink preference.'
          : 'Try adding your budget, food type, or drink preference.'),
      recommendations: [],
      query,
    });

    return {
      reply_text: completed.replyText,
      recommendations: [],
      follow_up_question: completed.followUpQuestion,
    };
  }

  const recommendations = topMenuCandidates.slice(0, 5).map((candidate) =>
    buildSingleRecommendation(candidate, query, normalizedLlm.reasonByMenuId)
  );

  const completed = ensureCompleteReply({
    replyText:
      normalizedLlm.replyText ||
      `I found ${recommendations.length} option${recommendations.length > 1 ? 's' : ''} that look like a good fit.`,
    followUpQuestion: normalizedLlm.followUpQuestion || null,
    recommendations,
    query,
  });

  return {
    reply_text: completed.replyText,
    recommendations,
    follow_up_question: completed.followUpQuestion,
  };
};
