import { getDeepSeekProvider } from './ai/deepseekProvider.js';
import { composeStructuredResponse } from './rag/responseComposer.service.js';
import { retrieveCandidates } from './rag/retriever.service.js';

const provider = getDeepSeekProvider();

const providerHasCredentials = () => {
  if (!provider || typeof provider.hasCredentials !== 'function') return false;
  return provider.hasCredentials();
};

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'unknown';
  return `$${number.toFixed(2)}`;
};

const buildSystemPrompt = ({ retrievalResult }) => {
  const menuCandidates = (retrievalResult.topMenuCandidates || [])
    .map((item, index) =>
      [
        `${index + 1}. ${item.name}`,
        `menu_id: ${item.id}`,
        `restaurant: ${item.restaurantName || 'unknown'}`,
        `price: ${formatPrice(item.price)}`,
        `score: ${Number(item.score || 0).toFixed(4)}`,
        `category: ${item.normalizedCategory || item.category || 'unknown'}`,
        `primary dish type: ${item.primaryDishType || 'unknown'}`,
        `proteins: ${(item.proteinTags || []).join(', ') || 'none'}`,
        `dish types: ${(item.dishTypes || []).join(', ') || 'none'}`,
        `cuisines: ${(item.cuisineTags || []).join(', ') || 'none'}`,
        `rating: ${item.rating ?? 'unknown'}`,
        `address: ${item.address || 'unknown'}`,
      ].join('\n')
    )
    .join('\n\n');

  const comboCandidate = retrievalResult.comboCandidate
    ? [
      `food: ${retrievalResult.comboCandidate.food?.name || 'unknown'}`,
      `food_menu_id: ${retrievalResult.comboCandidate.food?.id || 'unknown'}`,
      `drink: ${retrievalResult.comboCandidate.drink?.name || 'unknown'}`,
      `drink_menu_id: ${retrievalResult.comboCandidate.drink?.id || 'unknown'}`,
      `total_price: ${formatPrice(retrievalResult.comboCandidate.total)}`,
      `food_restaurant: ${retrievalResult.comboCandidate.food?.restaurantName || 'unknown'}`,
      `drink_restaurant: ${retrievalResult.comboCandidate.drink?.restaurantName || 'unknown'}`,
    ].join('\n')
    : 'None';

  const supportingChunks = (retrievalResult.supportingChunks || [])
    .map((chunk, index) => `${index + 1}. ${chunk.content}`)
    .join('\n');

  return `You are Forkcast, an AI food assistant for University of Auckland students.

Core role:
- Help the user decide what to eat first, then where to get it.
- Prioritise dishes or food-and-drink combinations, not restaurants alone.
- Be practical, concise, and student-focused.

Grounding rules:
- Use only the provided candidates and supporting evidence.
- Do not invent or assume dishes, restaurants, prices, ratings, addresses, map links, or attributes.
- Do not describe an item as healthy, popular, best value, affordable, light, or convenient unless the provided data clearly supports it.
- If the user asked for both food and drink, prefer the combo candidate when it clearly fits.
- Restaurants are supporting information for the food, not the main recommendation.

Reason-writing rules:
- Explain why the item fits the user's request using only supported details.
- Mention both the food fit and the restaurant fit when possible.
- Keep each reason short, specific, and natural.
- Do not use vague reasons by themselves, such as "budget-friendly", "good option", "nice choice", "great pick", or "fits your request".
- Every reason should mention at least one concrete supported factor such as dish type match, budget fit, combo fit, cuisine match, dietary match, rating, or restaurant fit.
- If you mention price fit, explain how it fits, such as staying within budget or leaving room for a drink.
- Avoid robotic phrases such as "strong match", "retrieval signal", "semantic score", or "based on the data provided".
- Do not repeat the same reason wording across multiple recommendations.

Conversation style:
- Start from the user's intent, and acknowledge it naturally.
- Sound warm and helpful, not like a form or checklist.
- Do not ask for information the user already gave.
- Do not stop after a bare acknowledgement. If you need more detail, include the actual follow-up question in the response.
- If constraints are tight, say that clearly and then lean toward the closest valid options from the candidates.
- Keep the wording easy to scan.

Selected menu candidates:
${menuCandidates || 'None'}

Selected combo candidate:
${comboCandidate}

Supporting evidence:
${supportingChunks || 'None'}`;
};

const recommendationJsonSchemaDescription = `Return a JSON object with this shape:
{
  "reply_text": "short natural-language summary",
  "recommendations": [
    {
      "menu_id": "string",
      "reason": "short explanation grounded in the dish and restaurant details"
    }
  ],
  "follow_up_question": "string or null"
}

Rules:
- Only use menu_id values that exist in the provided candidates.
- Keep reply_text short, natural, and user-facing.
- reply_text should briefly acknowledge what the user wants or what was found.
- Do not make reply_text sound robotic, repetitive, or overly generic.
- reply_text must not be a bare acknowledgement like "Got it, you want salad." by itself.
- If more detail is needed, either put the follow-up question directly into reply_text or provide a non-empty follow_up_question.
- Each reason must be grounded in the provided candidate details only.
- Each reason must be specific and user-facing, not generic filler.
- A reason like "budget-friendly" is not enough by itself.
- Prefer reasons that combine request match and budget fit when possible.
- Do not claim the item satisfies conditions it does not satisfy.
- Do not repeat the same wording across recommendation reasons.
- If there is a combo candidate and the user asked for both food and drink, you may return up to 2 recommendation objects, one for the food item and one for the drink item.
- Only include a follow_up_question when truly necessary.
- Never ask for information the user already provided.
- If enough valid candidates already exist, follow_up_question should be null.`;

const buildModelMessages = (messages = [], retrievalResult) => {
  const latestUserMessage = retrievalResult.query.raw;

  return [
    ...messages
      .filter((message) => typeof message?.content === 'string' && message.content.trim())
      .slice(-6)
      .map((message) => ({
        role: message.role,
        content: message.content,
      })),
    {
      role: 'user',
      content: `Latest user request: ${latestUserMessage}`,
    },
  ];
};

const getRequestedDishTerms = (query = {}) => [
  ...(query.requestedDishTerms || []),
  ...(query.requested_dish_terms || []),
  ...(query.requestedFoods || []),
];

const buildFallbackReason = (item, query) => {
  const parts = [];
  const haystack = `${item.name || ''} ${item.normalizedCategory || item.category || ''} ${(item.dishTypes || []).join(' ')} ${(item.proteinTags || []).join(' ')}`.toLowerCase();
  const requestedDishTerms = getRequestedDishTerms(query);

  if (
    requestedDishTerms.includes('steak') &&
    !haystack.includes('steak') &&
    (item.proteinTags || []).includes('beef')
  ) {
    parts.push('there is no exact steak option in the current results, so this is a beef-based fallback');
  } else if ((query.proteins || []).length && (item.proteinTags || []).some((tag) => query.proteins.includes(tag))) {
    parts.push(`it matches your ${query.proteins.join('/')} request`);
  } else if ((query.dishTypes || []).length && (item.dishTypes || []).some((tag) => query.dishTypes.includes(tag))) {
    parts.push(`it matches your ${query.dishTypes.join('/')} request`);
  } else if (requestedDishTerms.some((term) => haystack.includes(term))) {
    parts.push(`it matches your ${requestedDishTerms.find((term) => haystack.includes(term))} request`);
  }

  if (query.cuisines?.length && (item.cuisineTags || []).some((tag) => query.cuisines.includes(tag))) {
    parts.push(`it also fits your ${query.cuisines.join('/')} preference`);
  }

  if (query.budget != null && Number.isFinite(Number(item.price))) {
    parts.push(
      Number(item.price) <= query.budget
        ? `it stays within your ${formatPrice(query.budget)} budget`
        : `it is close to your ${formatPrice(query.budget)} budget`
    );
  }

  if (!parts.length) {
    parts.push('it is one of the closest matches from the menu data');
  }

  const restaurantPart =
    Number(item.rating) >= 4
      ? `${item.restaurantName} also has a strong rating`
      : `${item.restaurantName} is the restaurant offering it`;

  return `${parts.slice(0, 2).join(' and ')}. ${restaurantPart}.`;
};

const buildFallbackComboOutput = (retrievalResult) => {
  const combo = retrievalResult.comboCandidate;
  if (!combo?.food || !combo?.drink) return null;

  return {
    reply_text: 'I found a food and drink pairing that fits your request.',
    recommendations: [
      {
        menu_id: String(combo.food.id),
        reason: buildFallbackReason(combo.food, retrievalResult.query),
      },
      {
        menu_id: String(combo.drink.id),
        reason: buildFallbackReason(combo.drink, retrievalResult.query),
      },
    ],
    follow_up_question: null,
  };
};

const buildFallbackLlmOutput = (retrievalResult) => {
  if (retrievalResult.query.isComboRequest && retrievalResult.comboCandidate) {
    return buildFallbackComboOutput(retrievalResult);
  }

  return {
    reply_text: retrievalResult.topMenuCandidates.length
      ? `I found ${retrievalResult.topMenuCandidates.length} options that fit your request.`
      : 'I could not find a strong match yet.',
    recommendations: retrievalResult.topMenuCandidates.map((item) => ({
      menu_id: String(item.id),
      reason: buildFallbackReason(item, retrievalResult.query),
    })),
    follow_up_question: retrievalResult.topMenuCandidates.length
      ? null
      : 'What kind of cuisine, food type, or budget do you want?',
  };
};

export const getStructuredChatReply = async ({
  messages = [],
  dataset,
  debug = false,
} = {}) => {
  const latestUserMessage =
    [...messages].reverse().find((message) => message.role === 'user')?.content || '';

  const retrievalResult = await retrieveCandidates({
    dataset,
    latestUserMessage,
    messages,
    debug,
  });

  let llmOutput = null;

  if (providerHasCredentials() && !retrievalResult.query.shouldClarify) {
    try {
      const result = await provider.chatCompletion({
        systemPrompt: buildSystemPrompt({ retrievalResult }),
        messages: buildModelMessages(messages, retrievalResult),
        jsonSchemaDescription: recommendationJsonSchemaDescription,
        temperature: 0.2,
      });

      llmOutput = result?.json || null;
    } catch (error) {
      console.error('DeepSeek recommendation generation failed, using fallback:', error);
    }
  }

  const response = composeStructuredResponse({
    query: retrievalResult.query,
    topMenuCandidates: retrievalResult.topMenuCandidates || [],
    comboCandidate: retrievalResult.comboCandidate || null,
    llmOutput: llmOutput || buildFallbackLlmOutput(retrievalResult),
  });

  if (debug) {
    response.debug = retrievalResult.debug;
  }

  return response;
};

export const generateConversationTitle = async (messages = []) =>
  provider.generateTitle(messages);