import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FOOD_CARD_BACKGROUND_SRC } from '../../constants/foodCard.js';
import {
  CHAT_EMPTY_STATE_SUGGESTIONS,
  DEFAULT_WELCOME_MESSAGE,
} from '../../constants/chat.js';
import { formatChatDateTime } from '../../utils/date.js';
import RecommendationCard from '../RecommendationCard.jsx';

const GOOGLE_MAP_LINK_PATTERN =
  /google\.[^/\s]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|googleusercontent\.com\/maps|maps\./i;

const findLastRestaurantName = (text) => {
  const matches = [...text.matchAll(/Restaurant:\s*(.+)/gi)];
  const lastMatch = matches.at(-1);

  if (!lastMatch) return null;

  return lastMatch[1]?.trim() || null;
};

const normalizeMapLinks = (content) =>
  content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (match, label, href, offset) => {
    if (!GOOGLE_MAP_LINK_PATTERN.test(href)) {
      return match;
    }

    if (!/view on map|map/i.test(label.trim())) {
      return match;
    }

    // For combo recommendations, preserve the links but ensure they have proper restaurant names
    const restaurantName = findLastRestaurantName(content.slice(0, offset));

    if (restaurantName) {
      // Check if this is part of a combo (contains "and")
      if (restaurantName.includes(' and ')) {
        // For combos, keep the original link format
        return match;
      } else {
        // For single restaurants, use the restaurant name
        return `[${restaurantName}](${href})`;
      }
    }

    return match;
  });

const extractCardField = (section, label) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = section.match(new RegExp(`^${escapedLabel}:\\s*(.+)$`, 'im'));
  return match?.[1]?.trim() ?? '';
};
/**
 * Extracts restaurant and map information from card content
 * Supports multiple restaurants with separate map links for combo recommendations
 */
const extractRestaurantsAndMaps = (section) => {
  const restaurants = [];

  // Pattern 1: Restaurant: [Name](url) format
  const restaurantLinkMatches = [...section.matchAll(/Restaurant:\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi)];
  restaurantLinkMatches.forEach(match => {
    restaurants.push({
      name: match[1].trim(),
      mapUrl: match[2].trim(),
      type: 'restaurant'
    });
  });

  // Pattern 2: Map: [Label](url) format - associate with preceding restaurant
  const mapLinkMatches = [...section.matchAll(/Map:\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi)];
  mapLinkMatches.forEach((match) => {
    const mapLabel = match[1].trim();
    const mapUrl = match[2].trim();
    restaurants.push({
      name: mapLabel,
      mapUrl,
      type: 'map'
    });
  });

  // Pattern 3: Handle combo format like "Restaurant A and Restaurant B"
  if (restaurants.length === 0) {
    const restaurantLineMatches = [...section.matchAll(/Restaurant:\s*(.+?)(?=\n|$)/gi)];
    restaurantLineMatches.forEach(match => {
      const restaurantText = match[1].trim();

      // Check if it contains multiple restaurants (combo)
      const comboPattern = /(.+?)\s+and\s+(.+)/i;
      const comboMatch = restaurantText.match(comboPattern);

      if (comboMatch) {
        // This is a combo - split into two restaurants
        const restaurant1 = comboMatch[1].trim();
        const restaurant2 = comboMatch[2].trim();

        // Look for corresponding map links
        const afterRestaurant = section.substring(match.index + match[0].length);
        const mapMatches = [...afterRestaurant.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)];

        restaurants.push({
          name: restaurant1,
          mapUrl: mapMatches[0] ? mapMatches[0][2] : '#',
          type: 'restaurant'
        });

        restaurants.push({
          name: restaurant2,
          mapUrl: mapMatches[1] ? mapMatches[1][2] : '#',
          type: 'restaurant'
        });
      } else {
        // Single restaurant - look for map link
        const afterRestaurant = section.substring(match.index + match[0].length);
        const mapMatch = afterRestaurant.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);

        restaurants.push({
          name: restaurantText,
          mapUrl: mapMatch ? mapMatch[2] : '#',
          type: 'restaurant'
        });
      }
    });
  }

  // Remove duplicates based on name
  const uniqueRestaurants = restaurants.filter((restaurant, index, self) =>
    index === self.findIndex(r => r.name === restaurant.name)
  );

  return uniqueRestaurants;
};

/**
 * Parses price information, handling combo prices in format like "$10 + $8 = $18"
 * Returns an object with individual prices and total for combos
 */
const parsePriceInfo = (priceText, { isComboTitle = false, restaurantCount = 0 } = {}) => {
  if (!priceText) return null;

  const str = priceText.trim();
  const likelyCombo = isComboTitle || restaurantCount > 1;
  // 1) Named combo format: "Salad: $13, Smoothie: $8, Total: $21"
  const namedItemPattern = /([^:,\n]+?)\s*:\s*\$?(\d+(?:\.\d{2})?)/gi;
  const namedItems = [];
  let namedMatch;

  while ((namedMatch = namedItemPattern.exec(str)) !== null) {
    const name = namedMatch[1].trim();
    const price = parseFloat(namedMatch[2]);
    if (/^total$/i.test(name)) continue;
    if (/^price$/i.test(name)) {
      continue;
    }
    namedItems.push({ name, price });
  }

  if (namedItems.length >= 2) {
    const item1Price = namedItems[0].price;
    const item2Price = namedItems[1].price;
    const computedTotal = parseFloat((item1Price + item2Price).toFixed(2));

    return {
      isCombo: true,
      items: namedItems,
      item1Price,
      item2Price,
      totalPrice: computedTotal,
      displayText: `${namedItems[0].name}: $${item1Price.toFixed(2)}, ${namedItems[1].name}: $${item2Price.toFixed(2)}, Total: $${computedTotal.toFixed(2)}`
    };
  }

  // 2) Simple combo format: "$13 + $8 = $21"
  const comboPricePattern = /\$?(\d+(?:\.\d{2})?)\s*\+\s*\$?(\d+(?:\.\d{2})?)\s*=\s*\$?(\d+(?:\.\d{2})?)/i;
  const comboMatch = str.match(comboPricePattern);

  if (comboMatch) {
    const item1Price = parseFloat(comboMatch[1]);
    const item2Price = parseFloat(comboMatch[2]);
    const computedTotal = parseFloat((item1Price + item2Price).toFixed(2));

    return {
      isCombo: true,
      item1Price,
      item2Price,
      totalPrice: computedTotal,
      displayText: `$${item1Price.toFixed(2)} + $${item2Price.toFixed(2)} = $${computedTotal.toFixed(2)}`
    };
  }

  // 3) Fallback: if it says Total and has at least two numbers, assume combo
  const allNumbers = [...str.matchAll(/\$?(\d+(?:\.\d{2})?)/g)].map((m) => parseFloat(m[1]));
  if (/total/i.test(str) && allNumbers.length >= 2) {
    const item1Price = allNumbers[0];
    const item2Price = allNumbers[1];
    const computedTotal = parseFloat((item1Price + item2Price).toFixed(2));

    return {
      isCombo: true,
      item1Price,
      item2Price,
      totalPrice: computedTotal,
      displayText: `$${item1Price.toFixed(2)} + $${item2Price.toFixed(2)} = $${computedTotal.toFixed(2)}`
    };
  }

  // Single price
  const singlePriceMatch = str.match(/\$?(\d+(?:\.\d{2})?)/);
  if (singlePriceMatch) {
    const totalValue = parseFloat(singlePriceMatch[1]);

    if (likelyCombo) {
      return {
        isCombo: true,
        item1Price: null,
        item2Price: null,
        totalPrice: totalValue,
        hasIncompleteBreakdown: true,
        displayText: `Total: $${totalValue.toFixed(2)}`
      };
    }

    return {
      isCombo: false,
      totalPrice: totalValue,
      displayText: `$${totalValue.toFixed(2)}`
    };
  }

  return {
    isCombo: likelyCombo,
    item1Price: null,
    item2Price: null,
    totalPrice: null,
    hasIncompleteBreakdown: likelyCombo,
    displayText: likelyCombo ? 'Total unavailable' : 'Price unavailable'
  };
};

const convertReasonToTags = (reason) => {
  if (!reason) return [];

  const reasonText = reason.toLowerCase();

  // Define keyword mappings for common value propositions
  const keywordMappings = [
    // Taste & Quality
    { keywords: ['delicious', 'tasty', 'flavorful', 'rich', 'authentic', 'fresh'], tag: 'Rich flavor' },
    { keywords: ['spicy', 'mild', 'balanced'], tag: 'Great taste' },

    // Portion & Satisfaction
    { keywords: ['filling', 'satisfying', 'generous', 'large portion', 'hearty'], tag: 'Filling' },
    { keywords: ['light', 'healthy', 'fresh'], tag: 'Light & fresh' },

    // Price & Value
    { keywords: ['budget', 'affordable', 'cheap', 'value', 'inexpensive'], tag: 'Budget-friendly' },
    { keywords: ['premium', 'quality'], tag: 'Good value' },

    // Convenience & Speed
    { keywords: ['quick', 'fast', 'speedy', 'convenient'], tag: 'Quick meal' },
    { keywords: ['easy', 'simple'], tag: 'Easy option' },

    // Popularity & Recommendation
    { keywords: ['popular', 'favorite', 'recommended', 'best'], tag: 'Popular choice' },
    { keywords: ['student', 'university', 'campus'], tag: 'Student favorite' },

    // Dietary & Special
    { keywords: ['vegetarian', 'vegan'], tag: 'Plant-based' },
    { keywords: ['healthy', 'nutritious'], tag: 'Healthy choice' }
  ];

  const tags = [];

  // Extract matching tags (limit to 3-4 most relevant)
  keywordMappings.forEach(mapping => {
    if (mapping.keywords.some(keyword => reasonText.includes(keyword))) {
      if (!tags.includes(mapping.tag)) {
        tags.push(mapping.tag);
      }
    }
  });

  // If no specific matches, try to extract short positive phrases
  if (tags.length === 0) {
    const shortPhrases = reasonText.match(/\b\w{3,12}\b/g) || [];
    const positiveWords = shortPhrases.filter(word =>
      ['great', 'good', 'best', 'perfect', 'excellent', 'amazing', 'wonderful'].includes(word)
    );
    if (positiveWords.length > 0) {
      tags.push('Highly rated');
    }
  }

  // Ensure we have at least some tags, default to generic positive ones
  if (tags.length === 0) {
    tags.push('Recommended');
  }

  // Limit to 3-4 tags maximum
  return tags.slice(0, 4);
};

const buildCardBody = (lines) =>
  lines
    .slice(1)
    .join('\n')
    .replace(/^Food:\s*.+$/gim, '')
    .replace(/^Dish:\s*.+$/gim, '')
    .replace(/^Reason:\s*.+$/gim, '')
    .replace(/^Price:\s*.+$/gim, '')
    .replace(/^Restaurant:\s*.+$/gim, '')
    .replace(/^Includes?:\s*.+$/gim, '')
    .replace(/^Map:.*$/gim, '')

    // remove complete markdown links left alone on a line
    .replace(/^\[[^\]]+\]\((https?:\/\/[^\s)]+)\)\s*$/gim, '')

    // remove broken markdown-link fragments like:
    // z Bakery](https://maps.app.goo.gl/...)
    .replace(/^.*\]\((https?:\/\/[^\s)]+)\)\s*$/gim, '')

    // remove bare URL lines
    .replace(/^https?:\/\/\S+$/gim, '')
       // collapse extra blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const extractRestaurantCards = (content = '') => {
  const normalizedContent = normalizeMapLinks(content);
  const headingMatches = [...normalizedContent.matchAll(/^##\s+(.+)$/gm)];

  if (headingMatches.length === 0) {
    return {
      intro: normalizedContent.trim(),
      cards: [],
    };
  }

  const intro = normalizedContent.slice(0, headingMatches[0].index).trim();
  const cards = headingMatches.map((match, index) => {
    const sectionStart = match.index ?? 0;
    const sectionEnd =
      index < headingMatches.length - 1
        ? headingMatches[index + 1].index
        : normalizedContent.length;
    const section = normalizedContent.slice(sectionStart, sectionEnd).trim();
    const lines = section.split('\n');
    const title = lines[0].replace(/^##\s+/, '').trim();

    // Extract dish name (prioritize explicit Food/Dish fields, fallback to title)
    const dish = extractCardField(section, 'Food') || extractCardField(section, 'Dish') || title;

    // Convert long reason to short keyword tags
    const reasonText = extractCardField(section, 'Reason');
    const reasonTags = convertReasonToTags(reasonText);

    // Extract price with combo support
    const priceText = extractCardField(section, 'Price');
    const priceInfo = parsePriceInfo(priceText);

    // Extract multiple restaurants and map links
    const restaurants = extractRestaurantsAndMaps(section);

    // Build body content (remove redundant fields)
    const body = buildCardBody(lines);

    return {
      id: `${title}-${index}`,
      title,
      dish,
      reasonTags,
      fullReason: reasonText || '',
      priceInfo, // Structured price info with combo support
      body,
      restaurants, // Array of restaurant objects with name and mapUrl
      heroImage: FOOD_CARD_BACKGROUND_SRC,
    };
  });

  return { intro, cards };
};

const buildStructuredIntro = (structuredContent) => {
  const parts = [
    structuredContent?.reply_text,
    structuredContent?.follow_up_question,
  ].filter(Boolean);

  return parts.join('\n\n').trim();
};

const buildStructuredCards = (structuredContent) =>
  (structuredContent?.recommendations || []).map((recommendation, index) => {
    const restaurants = Array.isArray(recommendation.restaurants)
      ? recommendation.restaurants.filter((item) => item?.name && item?.mapUrl)
      : recommendation.map_url
        ? [
            {
              name: recommendation.restaurant_name || recommendation.restaurantName || 'Restaurant',
              mapUrl: recommendation.map_url,
              type: 'restaurant',
            },
          ]
        : [];

    const numericPrice = Number(recommendation.price);
    const priceBreakdown = recommendation.price_breakdown || recommendation.priceBreakdown || null;

    return {
      id: recommendation.menu_id || recommendation.id || `${recommendation.title || recommendation.name}-${index}`,
      title: recommendation.title || recommendation.name || 'Recommendation',
      dish: recommendation.title || recommendation.name || 'Recommendation',
      reasonTags: convertReasonToTags(recommendation.reason),
      fullReason: recommendation.reason || '',
      priceInfo: priceBreakdown
        ? {
            isCombo: Boolean(priceBreakdown.isCombo),
            item1Price: priceBreakdown.item1Price ?? null,
            item2Price: priceBreakdown.item2Price ?? null,
            totalPrice: priceBreakdown.totalPrice ?? (Number.isFinite(numericPrice) ? numericPrice : null),
            displayText: priceBreakdown.displayText || null,
          }
        : {
            isCombo: false,
            item1Price: null,
            item2Price: null,
            totalPrice: Number.isFinite(numericPrice) ? numericPrice : null,
            displayText: Number.isFinite(numericPrice)
              ? `$${numericPrice.toFixed(2)}`
              : 'Price unavailable',
          },
      body: recommendation.reason || '',
      restaurants,
      heroImage: recommendation.imageUrl || FOOD_CARD_BACKGROUND_SRC,
    };
  });

const MarkdownContent = ({ content }) => (
  <div className="prose prose-sm max-w-none text-inherit prose-p:my-0 prose-li:my-1 prose-strong:text-inherit prose-a:no-underline">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          const isGoogleMapLink =
            typeof href === 'string' &&
            GOOGLE_MAP_LINK_PATTERN.test(href);

          if (!href) {
            return <span>{children}</span>;
          }

          if (isGoogleMapLink) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100 hover:text-orange-800"
              >
                {children}
              </a>
            );
          }

          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-700 underline underline-offset-2"
            >
              {children}
            </a>
          );
        },
        p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
      }}
    >
      {normalizeMapLinks(content)}
    </ReactMarkdown>
  </div>
);

export default function PageChatMessages({
  messages,
  onSuggestionClick,
  pendingReply,
  pendingReplyLabel,
  pendingReplyTimestamp,
  scrollRef,
  welcomeMessage = DEFAULT_WELCOME_MESSAGE,
}) {
  return (
    <div
      ref={scrollRef}
      // 🟢 修改：移动端减小外边距 (p-4)，缩小消息间距 (space-y-4)
      className="custom-scrollbar flex-1 space-y-4 md:space-y-6 overflow-y-auto p-4 md:p-8 scroll-smooth"
    >
      {messages.length === 0 ? (
        <div className="animate-in fade-in flex h-full flex-col items-center justify-center text-center opacity-80 duration-500 mt-10 md:mt-0">
          <div className="mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full border border-white/60 bg-white/50 text-3xl md:text-4xl text-orange-500 shadow-sm">
            👋
          </div>
          <h2 className="mb-3 text-2xl md:text-3xl font-bold text-[#4e342e]">
            Hi, I’m Forkcast
          </h2>
          <p className="max-w-xl text-xs md:text-sm leading-relaxed text-stone-500 px-4">
            {welcomeMessage}
          </p>
          <p className="mt-3 max-w-xl text-xs md:text-sm leading-relaxed text-stone-500 px-4">
            Ask for a dish, a drink, or a combo. You can also mention your total budget, like salad and lemon tea under $20.
          </p>
          <div className="mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2 md:gap-3 px-2">
            {CHAT_EMPTY_STATE_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick?.(suggestion)}
                className="rounded-full border border-orange-200 bg-white/70 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-[#7a4b36] transition hover:border-orange-300 hover:bg-orange-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const structuredContent = !isUser ? message.structuredContent : null;
          const { intro, cards } = !isUser && structuredContent
            ? {
                intro: buildStructuredIntro(structuredContent),
                cards: buildStructuredCards(structuredContent),
              }
            : !isUser && message.content
              ? extractRestaurantCards(message.content)
              : { intro: '', cards: [] };

          return (
            <div
              key={message.id}
              // 🟢 修改：移动端缩小头像和气泡的间距 (gap-2)
              className={`animate-in fade-in slide-in-from-bottom-2 flex gap-2 md:gap-4 duration-300 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                // 🟢 修改：移动端稍微缩小头像
                <div className="mt-4 flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-white text-sm md:text-lg shadow-sm">
                  🍜
                </div>
              )}

              <div
                // 🟢 修改：放宽移动端宽度限制 (max-w-[85%])，防止文字过早换行
                className={`space-y-1 ${
                  isUser
                    ? 'max-w-[85%] md:max-w-[70%] text-right'
                    : cards.length > 0
                      ? 'w-full max-w-full md:max-w-[980px]'
                      : 'max-w-[85%] md:max-w-[70%]'
                }`}
              >
                <p className="px-2 text-[10px] text-gray-500">
                  {formatChatDateTime(message.timestamp)}
                </p>

                <div
                  // 🟢 修改：稍微减小移动端的内边距 (p-3)
                  className={`rounded-2xl p-3 md:p-4 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'rounded-tr-none bg-[#ffccbc] text-[#4e342e]'
                      : cards.length > 0
                        ? 'w-full rounded-tl-none border border-white/60 bg-white/85 text-gray-700 backdrop-blur-sm'
                        : 'rounded-tl-none border border-white/60 bg-white/80 text-gray-700 backdrop-blur-sm'
                  }`}
                >
                  {message.content || cards.length > 0 ? (
                    cards.length > 0 ? (
                      <div className="space-y-4">
                        {intro ? <MarkdownContent content={intro} /> : null}

                        <div className="grid gap-4">
                          {cards.map((card) => (
                            <RecommendationCard
                              key={card.id}
                              dish={card.dish || card.title}
                              reasonTags={card.reasonTags}
                              fullReason={card.fullReason}
                              priceInfo={card.priceInfo}
                              heroImage={card.heroImage}
                              body={card.body}
                              restaurants={card.restaurants}
                              title={card.title}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <MarkdownContent content={message.content} />
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}

                  {message.image && (
                    <div className="group mt-4 cursor-pointer overflow-hidden rounded-xl border border-white/60 bg-white shadow-md transition-all hover:scale-[1.02]">
                      <img
                        src={message.image}
                        alt="Recommendation"
                        className="h-40 w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                      />
                      {message.recommendation && (
                        <div className="bg-[#fcf9f2] p-4">
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="font-serif text-base font-bold text-gray-900">
                              {message.recommendation.name}
                            </h4>
                            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              {message.recommendation.rating}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-stone-500">
                            {message.recommendation.desc}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {isUser && (
                // 🟢 修改：移动端稍微缩小头像
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                  className="mt-4 h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-full border-2 border-white shadow-sm"
                  alt="Me"
                />
              )}
            </div>
          );
        })}

        {pendingReply ? (
          // 🟢 修改：同步修改“等待回复”状态的样式
          <div className="animate-in fade-in slide-in-from-bottom-2 flex gap-2 md:gap-4 duration-300">
            <div className="mt-4 flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-white text-sm md:text-lg shadow-sm">
              🍜
            </div>

            <div className="max-w-[85%] md:max-w-[70%] space-y-1">
              <p className="px-2 text-[10px] text-gray-500">
                {formatChatDateTime(pendingReplyTimestamp)}
              </p>

              <div className="rounded-2xl rounded-tl-none border border-white/60 bg-white/80 p-3 md:p-4 text-sm leading-relaxed text-gray-700 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span>{pendingReplyLabel}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        </>
      )}
    </div>
  );
}