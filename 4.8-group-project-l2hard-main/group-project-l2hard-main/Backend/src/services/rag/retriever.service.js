import { generateEmbedding } from './embedding.service.js';
import { getFusionWeights, fuseRetrievalScores } from './fusion.service.js';
import { ensureRagIndex, getRagIndexState, readPersistedRagStatus } from './ragIndex.service.js';
import { parseConversationQuery } from './queryParser.service.js';

const tokenize = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const normalizeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const keywordScore = (content = '', keywords = []) => {
  if (!keywords.length) return 0;
  const haystack = tokenize(content);
  return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1.5 : 0), 0);
};

const titleKeywordScore = (document = {}, keywords = []) => {
  const title = String(
    document.descriptiveFields?.title || document.metadata?.menuName || ''
  ).toLowerCase();

  return keywords.reduce((score, keyword) => score + (title.includes(keyword) ? 2 : 0), 0);
};

const proteinMatchScore = (metadata = {}, query = {}) => {
  const requestedProteins = query.proteins || [];
  if (!requestedProteins.length) return 0;

  const availableProteins = (metadata.proteinTags || []).map((item) => String(item).toLowerCase());
  const overlap = requestedProteins.filter((protein) => availableProteins.includes(protein));

  return overlap.length ? overlap.length * 3 : -2.5;
};

const dishTypeMatchScore = (metadata = {}, query = {}) => {
  const requestedDishTypes = query.dishTypes || query.dish_types || [];
  if (!requestedDishTypes.length) return 0;

  const normalizedRequested = requestedDishTypes.map((type) =>
    type === 'noodles' ? 'noodle' : String(type).toLowerCase()
  );
  const availableDishTypes = (metadata.dishTypes || []).map((item) =>
    item === 'noodles' ? 'noodle' : String(item).toLowerCase()
  );
  const primary = String(metadata.primaryDishType || '').toLowerCase();

  const overlap = normalizedRequested.filter(
    (type) => availableDishTypes.includes(type) || primary === type
  );

  return overlap.length ? overlap.length * 3 : -2;
};

const cuisineMatchScore = (metadata = {}, query = {}) => {
  const requestedCuisines = query.cuisines || [];
  if (!requestedCuisines.length) return 0;

  const available = (metadata.cuisineTypes || []).map((item) => String(item).toLowerCase());
  const overlap = requestedCuisines.filter((item) => available.includes(item));

  return overlap.length ? overlap.length * 2 : -1.5;
};

const requestedTermScore = (document = {}, query = {}) => {
  const title = String(document.descriptiveFields?.title || document.metadata?.menuName || '').toLowerCase();
  const requestedDishTerms =
    query.requestedDishTerms || query.requested_dish_terms || query.requestedFoods || [];

  return requestedDishTerms.reduce((score, term) => score + (title.includes(term) ? 2 : 0), 0);
};

const semanticScore = (document, query) => {
  const metadata = document.metadata || {};
  let score = 0;

  if (query.intent === 'food') score += metadata.supportsFoodIntent ? 2 : -3;
  if (query.intent === 'drink') score += metadata.supportsDrinkIntent ? 2 : -3;

  if (query.requiresMainDish || query.requires_main_dish) {
    score += metadata.isMainDish ? 2.5 : metadata.isSide ? -1 : 0;
  }

  if (metadata.isAddon) score -= 8;
  if (metadata.isSide && (query.requiresMainDish || query.requires_main_dish)) score -= 3;

  score += proteinMatchScore(metadata, query);
  score += dishTypeMatchScore(metadata, query);
  score += cuisineMatchScore(metadata, query);
  score += requestedTermScore(document, query);

  if (query.dining_goal === 'light') {
    score += metadata.primaryDishType === 'salad' || metadata.primaryDishType === 'soup' ? 2 : 0;
  }

  if (query.dining_goal === 'filling') {
    score += ['rice', 'noodle', 'burger', 'pasta', 'bento', 'box', 'pizza'].includes(
      String(metadata.primaryDishType || '').toLowerCase()
    )
      ? 1.5
      : 0;
  }

  if (query.budget != null && Number.isFinite(metadata.price)) {
    score += metadata.price <= query.budget ? 3 : -4;
  }

  if (query.wantsHighRated && Number(metadata.rating) >= 4) score += 1;

  return score;
};

const businessRuleBonus = (document, query) => {
  const metadata = document.metadata || {};
  let score = 0;

  if (query.budget != null && Number.isFinite(metadata.price)) {
    score += metadata.price <= query.budget ? 1.5 : -5;
  }

  if (query.distance_preference === 'near' && metadata.address) score += 0.3;
  if (Number(metadata.rating) >= 4) score += 0.5;
  if (metadata.isAddon) score -= 8;
  if ((query.requiresMainDish || query.requires_main_dish) && metadata.isSide) score -= 2;

  return score;
};

const buildDocumentLookup = (documents = []) =>
  new Map(documents.map((document) => [document.id, document]));

const toRankedEntries = (entries = [], lookup) =>
  entries.map((entry) => ({
    ...entry,
    document: lookup.get(entry.documentId) || entry.document,
  }));

const isDrinkLike = (metadata = {}) => {
  if (metadata.supportsDrinkIntent && !metadata.supportsFoodIntent) return true;

  const primary = String(metadata.primaryDishType || '').toLowerCase();
  const category = String(metadata.category || '').toLowerCase();
  const dishTypes = (metadata.dishTypes || []).map((item) => String(item).toLowerCase());
  const text = `${primary} ${category} ${dishTypes.join(' ')}`;

  return [
    'tea',
    'coffee',
    'drink',
    'smoothie',
    'juice',
    'milk tea',
    'bubble tea',
    'boba',
    'latte',
    'americano',
    'espresso',
  ].some((term) => text.includes(term));
};

const isFoodLike = (metadata = {}) => {
  if (metadata.supportsFoodIntent) return true;
  if (metadata.isMainDish || metadata.isSide) return true;

  const primary = String(metadata.primaryDishType || '').toLowerCase();
  const dishTypes = (metadata.dishTypes || []).map((item) => String(item).toLowerCase());
  const text = `${primary} ${dishTypes.join(' ')}`;

  return [
    'burger',
    'salad',
    'noodle',
    'rice',
    'bento',
    'dumpling',
    'wrap',
    'bun',
    'soup',
    'pizza',
    'pasta',
    'sandwich',
    'box',
  ].some((term) => text.includes(term));
};

const scoreFoodCandidate = (candidate = {}, query = {}) => {
  let score = Number(candidate.score || 0);
  const text = normalizeText(
    [
      candidate.name,
      candidate.normalizedCategory,
      candidate.primaryDishType,
      ...(candidate.proteinTags || []),
      ...(candidate.dishTypes || []),
      ...(candidate.cuisineTags || []),
      ...(candidate.restaurantCuisineTypes || []),
    ]
      .filter(Boolean)
      .join(' ')
  );

  if (query.requestedFoods?.length) {
    const matches = query.requestedFoods.filter((term) => text.includes(String(term).toLowerCase()));
    score += matches.length * 3;
  }

  if (query.proteins?.length) {
    const matches = query.proteins.filter((term) => text.includes(String(term).toLowerCase()));
    score += matches.length * 3;
  }

  const requestedDishTypes = query.dishTypes || query.dish_types || [];
  if (requestedDishTypes.length) {
    const matches = requestedDishTypes.filter((term) => text.includes(String(term).toLowerCase()));
    score += matches.length * 3;
  }

  if (query.cuisines?.length) {
    const matches = query.cuisines.filter((term) => text.includes(String(term).toLowerCase()));
    score += matches.length * 2;
  }

  if (candidate.isAddon) score -= 8;
  if (candidate.isSide && query.intent === 'food') score -= 4;
  if (candidate.isDrink) score -= 6;

  if (query.budget != null && Number.isFinite(Number(candidate.price))) {
    if (Number(candidate.price) <= Number(query.budget)) score += 2;
    else score -= 6;
  }

  return score;
};

const scoreDrinkCandidate = (candidate = {}, query = {}) => {
  let score = Number(candidate.score || 0);
  const text = normalizeText(
    [
      candidate.name,
      candidate.normalizedCategory,
      candidate.primaryDishType,
      ...(candidate.dishTypes || []),
      ...(candidate.cuisineTags || []),
      ...(candidate.restaurantCuisineTypes || []),
    ]
      .filter(Boolean)
      .join(' ')
  );

  if (query.requestedDrinks?.length) {
    const matches = query.requestedDrinks.filter((term) => text.includes(String(term).toLowerCase()));
    score += matches.length * 4;
  }

  if (!candidate.isDrink) score -= 8;
  if (candidate.isAddon) score -= 2;

  if (query.budget != null && Number.isFinite(Number(candidate.price))) {
    if (Number(candidate.price) <= Number(query.budget)) score += 1.5;
    else score -= 6;
  }

  return score;
};

const buildComboCandidate = (foodCandidates = [], drinkCandidates = [], query = {}) => {
  if (!(query.isComboRequest || query.intent === 'combo')) return null;

  const sortedFoods = [...foodCandidates]
    .filter((item) => !item.isAddon && !item.isDrink)
    .sort((a, b) => scoreFoodCandidate(b, query) - scoreFoodCandidate(a, query))
    .slice(0, 6);

  const sortedDrinks = [...drinkCandidates]
    .filter((item) => item.isDrink)
    .sort((a, b) => scoreDrinkCandidate(b, query) - scoreDrinkCandidate(a, query))
    .slice(0, 6);

  let best = null;

  for (const food of sortedFoods) {
    for (const drink of sortedDrinks) {
      const total = Number(food.price || 0) + Number(drink.price || 0);

      if (query.budget != null && total > Number(query.budget)) continue;

      const comboScore = scoreFoodCandidate(food, query) + scoreDrinkCandidate(drink, query);

      if (!best || comboScore > best.score) {
        best = {
          food,
          drink,
          total,
          score: comboScore,
        };
      }
    }
  }

  return best;
};

const passesHardConstraints = (document, query) => {
  const metadata = document.metadata || {};
  const title = `${metadata.menuName || ''} ${metadata.category || ''}`.toLowerCase();

  const requestedDishTypes = query.dishTypes || query.dish_types || [];
  const requestedDishTerms =
    query.requestedDishTerms || query.requested_dish_terms || query.requestedFoods || [];

  if (query.intent === 'food' && !metadata.supportsFoodIntent) return false;
  if (query.intent === 'drink' && !metadata.supportsDrinkIntent) return false;

  if (query.hard_constraints?.excludeAddon && metadata.isAddon) return false;

  if ((query.requiresMainDish || query.requires_main_dish) && (metadata.isAddon || (!metadata.isMainDish && metadata.isSide))) {
    return false;
  }

  if (query.proteins?.length) {
    const proteinTags = (metadata.proteinTags || []).map((item) => String(item).toLowerCase());
    const hasProtein = query.proteins.some((protein) => proteinTags.includes(String(protein).toLowerCase()));

    if (!hasProtein) return false;
  }

  if (query.cuisines?.length) {
    const cuisines = (metadata.cuisineTypes || []).map((item) => String(item).toLowerCase());
    const hasCuisine = query.cuisines.some((cuisine) => cuisines.includes(String(cuisine).toLowerCase()));

    if (!hasCuisine) return false;
  }

  if (requestedDishTypes.length) {
    const dishTypes = (metadata.dishTypes || []).map((item) =>
      item === 'noodles' ? 'noodle' : String(item).toLowerCase()
    );
    const primary = String(metadata.primaryDishType || '')
      .toLowerCase()
      .replace('noodles', 'noodle');
    const requested = requestedDishTypes.map((type) =>
      String(type).toLowerCase().replace('noodles', 'noodle')
    );

    const hasDishType = requested.some((type) => dishTypes.includes(type) || primary === type);

    if (!hasDishType) return false;
  }

  if (requestedDishTerms.includes('steak') && !title.includes('steak')) return false;
  if (requestedDishTerms.includes('salad') && String(metadata.primaryDishType || '').toLowerCase() !== 'salad') {
    return false;
  }
  if (
    (requestedDishTerms.includes('noodles') || requestedDishTerms.includes('noodle')) &&
    !['noodle', 'noodles'].includes(String(metadata.primaryDishType || '').toLowerCase())
  ) {
    return false;
  }

  if (query.budget != null && Number.isFinite(metadata.price) && metadata.price > query.budget) {
    return false;
  }

  return true;
};

export const retrieveCandidates = async ({ dataset, latestUserMessage = '', messages = [], debug = false } = {}) => {
  const query = parseConversationQuery({ latestMessage: latestUserMessage, messages, dataset });
  if (query.shouldClarify) {
    return {
      query,
      topMenuCandidates: [],
      comboCandidate: null,
      topRestaurantCandidates: [],
      supportingChunks: [],
      debug: debug
        ? {
            parsedQuery: query,
            ragStatus: getRagIndexState(),
            persistedStatus: await readPersistedRagStatus(),
            activeConstraintMode: 'clarification_gate',
          }
        : undefined,
    };
  }

  const ragIndex = await ensureRagIndex({ dataset });

  const allDocuments = ragIndex.docs || [];
  const allMenuDocuments = allDocuments.filter((document) => document.type === 'menu_item');
  const restaurantDocuments = allDocuments.filter((document) => document.type === 'restaurant');

  let activeConstraintMode = 'strict';

  let menuItemDocuments = allMenuDocuments.filter((document) => passesHardConstraints(document, query));

  if (!menuItemDocuments.length && (query.requestedDishTerms?.length || query.requested_dish_terms?.length || query.requestedFoods?.length)) {
    activeConstraintMode = 'relaxed_requested_term';
    const relaxedQuery = {
      ...query,
      requestedDishTerms: [],
      requested_dish_terms: [],
      requestedFoods: [],
    };
    menuItemDocuments = allMenuDocuments.filter((document) => passesHardConstraints(document, relaxedQuery));
  }

  if (!menuItemDocuments.length && query.cuisines?.length) {
    activeConstraintMode = 'relaxed_cuisine';
    const relaxedQuery = {
      ...query,
      cuisines: [],
      cuisine: null,
    };
    menuItemDocuments = allMenuDocuments.filter((document) => passesHardConstraints(document, relaxedQuery));
  }

  if (!menuItemDocuments.length && (query.intent === 'combo' || query.isComboRequest)) {
    activeConstraintMode = 'combo_fallback';
    menuItemDocuments = allMenuDocuments.filter((document) => {
      const metadata = document.metadata || {};
      if (query.budget != null && Number.isFinite(metadata.price) && metadata.price > query.budget) return false;
      return metadata.supportsFoodIntent || metadata.supportsDrinkIntent;
    });
  }

  const documentLookup = buildDocumentLookup(allDocuments);
  const queryEmbedding = generateEmbedding(query.raw);

  const keywordResults = menuItemDocuments
    .map((document) => ({
      documentId: document.id,
      score: keywordScore(document.content, query.keywords) + titleKeywordScore(document, query.keywords),
      document,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const vectorResults = toRankedEntries(
    ragIndex.documentStore.query({
      embedding: queryEmbedding,
      topK: 24,
      filter: (entry) =>
        entry.type === 'menu_item' && menuItemDocuments.some((doc) => doc.id === entry.documentId),
    }),
    documentLookup
  ).slice(0, 12);

  const semanticResults = menuItemDocuments
    .map((document) => ({
      documentId: document.id,
      score: semanticScore(document, query),
      document,
    }))
    .filter((entry) => entry.score > -3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const chunkResults = ragIndex.chunkStore
    .query({
      embedding: queryEmbedding,
      topK: 24,
      filter: (entry) => {
        if (entry.type === 'restaurant') return true;

        return menuItemDocuments.some(
          (doc) => doc.id === entry.documentId || doc.id === `menu:${entry.metadata?.menuId}`
        );
      },
    })
    .map((entry) => ({ ...entry, chunk: entry.chunk }))
    .slice(0, 16);

  const fusedMenuResults = fuseRetrievalScores({
    groups: {
      keyword: keywordResults,
      vector: vectorResults,
      semantic: semanticResults,
      chunk: chunkResults
        .filter((entry) => entry.chunk?.metadata?.menuId)
        .map((entry) => ({
          documentId: `menu:${entry.chunk.metadata.menuId}`,
          score: entry.score,
          document: documentLookup.get(`menu:${entry.chunk.metadata.menuId}`),
        })),
      business: menuItemDocuments.map((document) => ({
        documentId: document.id,
        score: businessRuleBonus(document, query),
        document,
      })),
    },
    weights: getFusionWeights(),
  }).slice(0, 12);

  const enrichedCandidates = fusedMenuResults
    .map((entry) => {
      const source = entry.document?.source;
      const metadata = entry.document?.metadata || {};
      if (!source) return null;

      return {
        ...source,
        score: entry.totalScore,
        scoreBreakdown: entry.breakdown,
        normalizedCategory: metadata.normalizedCategory || metadata.category || '',
        proteinTags: metadata.proteinTags || [],
        cuisineTags: metadata.cuisineTypes || [],
        dishTypes: metadata.dishTypes || [],
        primaryDishType: metadata.primaryDishType || null,
        isAddon: Boolean(metadata.isAddon),
        isMainDish: Boolean(metadata.isMainDish),
        isSide: Boolean(metadata.isSide),
        isDrink: isDrinkLike(metadata),
        isFood: isFoodLike(metadata),
        restaurantCuisineTypes: metadata.cuisineTypes || [],
        evidence: [
          `Category: ${metadata.normalizedCategory || metadata.category || 'unknown'}`,
          `Restaurant: ${source.restaurantName || 'unknown'}`,
        ],
      };
    })
    .filter(Boolean);

  const rerankedFoodCandidates = [...enrichedCandidates]
    .sort((a, b) => scoreFoodCandidate(b, query) - scoreFoodCandidate(a, query))
    .slice(0, 10);

  const rerankedDrinkCandidates = [...enrichedCandidates]
    .sort((a, b) => scoreDrinkCandidate(b, query) - scoreDrinkCandidate(a, query))
    .slice(0, 10);

  const comboCandidate = buildComboCandidate(rerankedFoodCandidates, rerankedDrinkCandidates, query);

  let topMenuCandidates = rerankedFoodCandidates;

  if (query.intent === 'drink') {
    topMenuCandidates = rerankedDrinkCandidates.filter((item) => item.isDrink).slice(0, 5);
  } else if (query.intent === 'food') {
    topMenuCandidates = rerankedFoodCandidates.filter((item) => !item.isDrink).slice(0, 5);
  } else if (query.intent === 'combo') {
    topMenuCandidates = rerankedFoodCandidates.filter((item) => !item.isDrink).slice(0, 5);
  } else {
    topMenuCandidates = rerankedFoodCandidates.slice(0, 5);
  }

  const topRestaurantCandidates = restaurantDocuments
    .map((document) => ({
      source: document.source,
      score:
        keywordScore(document.content, query.keywords) +
        (query.cuisines?.some((item) =>
          (document.metadata?.derivedCuisineTypes || []).includes(item)
        )
          ? 2
          : 0) +
        (query.intent === 'drink' && document.metadata?.supportsDrink ? 1 : 0) +
        (query.intent === 'food' && document.metadata?.supportsFood ? 1 : 0) +
        (query.intent === 'combo' && document.metadata?.supportsFood && document.metadata?.supportsDrink ? 1.5 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => ({
      id: String(entry.source._id),
      name: entry.source.name,
      score: Number((entry.score || 0).toFixed(4)),
      mapUrl: entry.source.location?.googleMapsUrl || null,
    }));

  const supportingChunks = chunkResults.slice(0, 8).map((entry) => ({
    id: entry.documentId,
    score: Number(entry.score.toFixed(4)),
    content: entry.content,
    metadata: entry.metadata,
  }));

  return {
    query,
    topMenuCandidates,
    comboCandidate,
    topRestaurantCandidates,
    supportingChunks,
    debug: debug
      ? {
        parsedQuery: query,
        ragStatus: getRagIndexState(),
        persistedStatus: await readPersistedRagStatus(),
        activeConstraintMode,
        keywordResults: keywordResults.map((entry) => ({
          documentId: entry.documentId,
          score: Number(entry.score.toFixed(4)),
        })),
        vectorResults: vectorResults.map((entry) => ({
          documentId: entry.documentId,
          score: Number(entry.score.toFixed(4)),
        })),
        semanticResults: semanticResults.map((entry) => ({
          documentId: entry.documentId,
          score: Number(entry.score.toFixed(4)),
        })),
        chunkResults: chunkResults.map((entry) => ({
          documentId: entry.documentId,
          score: Number(entry.score.toFixed(4)),
          blockType: entry.metadata?.blockType || null,
        })),
        fusionBreakdown: fusedMenuResults.map((entry) => ({
          documentId: entry.documentId,
          totalScore: Number(entry.totalScore.toFixed(4)),
          breakdown: entry.breakdown,
        })),
        finalCandidates: topMenuCandidates.map((item) => ({
          id: item.id,
          name: item.name,
          score: Number(item.score.toFixed(4)),
          primaryDishType: item.primaryDishType,
          proteinTags: item.proteinTags,
          dishTypes: item.dishTypes,
          isAddon: item.isAddon,
          isDrink: item.isDrink,
        })),
        comboCandidate: comboCandidate
          ? {
            food: comboCandidate.food.name,
            drink: comboCandidate.drink.name,
            total: Number(comboCandidate.total.toFixed(2)),
            score: Number(comboCandidate.score.toFixed(4)),
          }
          : null,
      }
      : undefined,
  };
};

export const getRagStatus = async () => readPersistedRagStatus();

export const reindexRagForDataset = async ({ dataset, logger = console } = {}) => {
  await ensureRagIndex({ dataset, forceReindex: true, logger });
  return getRagIndexState();
};