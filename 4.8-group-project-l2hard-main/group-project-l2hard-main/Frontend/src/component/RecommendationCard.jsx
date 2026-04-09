import React from 'react';

/**
 * RecommendationCard - A polished, food-focused recommendation card
 * 
 * Design features:
 * - Two-section layout: hero (image + key info) and details
 * - Dish name as primary visual focus
 * - Warm, cozy, appetite-appealing aesthetic
 * - Clear information hierarchy
 * - Subtle hover effect for engagement
 * - Structured content with keyword tags and clear restaurant info
 * 
 * Props:
 *   - dish: string - Main dish name (displayed prominently)
 *   - reasonTags: string[] - Array of short keyword tags (e.g., ["Filling", "Budget-friendly"])
 *   - priceInfo: object - Structured price info {isCombo, item1Price, item2Price, totalPrice, displayText}
 *   - heroImage: string - Background image URL
 *   - body: string - Detailed information (markdown supported)
 *   - restaurants: Array<{name: string, mapUrl: string, type: string}> - Restaurant info with map links
 *   - title: string - Fallback title if dish is not provided
 */

/**
 * Renders keyword tags as small, scannable badges
 * Displays value propositions like "Filling", "Budget-friendly", etc.
 */
const renderReasonTags = (tags) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.slice(0, 4).map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white/90 text-orange-700 rounded-full border border-orange-200/50 backdrop-blur-sm"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

/**
 * Maps food-related keywords to appropriate emojis
 * Keeps emoji usage minimal and contextually relevant
 */
const getFoodEmoji = (text) => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('rice') || lowerText.includes('bowl')) return '🍚';
  if (lowerText.includes('noodle') || lowerText.includes('ramen') || lowerText.includes('pasta')) return '🍜';
  if (lowerText.includes('beef') || lowerText.includes('steak')) return '🥩';
  if (lowerText.includes('chicken') || lowerText.includes('poultry')) return '🐔';
  if (lowerText.includes('drink') || lowerText.includes('beverage') || lowerText.includes('coffee')) return '🥤';
  if (lowerText.includes('burger') || lowerText.includes('hamburger')) return '🍔';
  if (lowerText.includes('taco') || lowerText.includes('mexican')) return '🌮';
  if (lowerText.includes('pizza')) return '🍕';
  if (lowerText.includes('sushi') || lowerText.includes('fish')) return '🍣';
  if (lowerText.includes('salad') || lowerText.includes('vegetable')) return '🥗';
  if (lowerText.includes('sandwich')) return '🥪';
  if (lowerText.includes('soup')) return '🍲';

  return null;
};

const formatPrice = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return null;

  return `$${amount.toFixed(2)}`;
};

const getCardPriceText = (priceInfo) => {
  if (!priceInfo) return '';

  if (priceInfo.isCombo) {
    const firstPrice = formatPrice(priceInfo.item1Price);
    const secondPrice = formatPrice(priceInfo.item2Price);
    const totalPrice = formatPrice(priceInfo.totalPrice);

    if (firstPrice && secondPrice && totalPrice) {
      return `${firstPrice} + ${secondPrice} = ${totalPrice}`;
    }

    if (totalPrice) {
      return `Total: ${totalPrice}`;
    }
  }

  return formatPrice(priceInfo.totalPrice) || priceInfo.displayText;
};

export default function RecommendationCard({
  dish,
  reasonTags,
  fullReason,
  priceInfo,
  heroImage,
  body,
  restaurants,
  title,
}) {
  const displayDish = dish || title;
  const cardPriceText = getCardPriceText(priceInfo);

  return (
    <article className="group overflow-hidden rounded-[28px] border border-stone-100/80 bg-white shadow-[0_8px_32px_rgba(93,64,55,0.08)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(93,64,55,0.15)] hover:-translate-y-1">
      {/* HERO SECTION - Food-focused with image background */}
      <div className="relative h-56 overflow-hidden bg-linear-to-br from-orange-50 to-amber-50">
        {/* Background image with subtle overlay */}
        <img
          src={heroImage}
          alt={displayDish}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay - enhances text readability while keeping image visible */}
        <div className="absolute inset-0 bg-linear-to-t from-black/30 via-black/10 to-transparent opacity-70" />

        {/* Hero text content - overlaid on image */}
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-6">
          {/* Combo indicator for multiple restaurants */}
          {restaurants && restaurants.length > 1 && (
            <div className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-500/90 text-white rounded-full backdrop-blur-sm">
              🍽️ Combo Deal
            </div>
          )}

          {/* Dish name - PRIMARY FOCUS */}
          <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
            {displayDish}
          </h3>

          {/* Reason tags - concise recommendation reasons shown as quick highlights */}
          {renderReasonTags(reasonTags)}

          {/* Fall back to the full reason only when tags are unavailable */}
          {!reasonTags?.length && fullReason ? (
            <p className="max-w-2xl text-sm font-medium leading-6 text-white/95 drop-shadow">
              {fullReason}
            </p>
          ) : null}

          {/* Price badge - Eye-catching but not dominant */}
          {priceInfo && (
            <div className={`mt-3 inline-flex items-center rounded-full border backdrop-blur-sm shadow-sm ${
              priceInfo.isCombo
                ? 'border-orange-300/80 bg-white/95 px-4 py-2'
                : 'border-orange-200/80 bg-white/95 px-4 py-1.5'
            }`}>
              <span className={`font-bold text-orange-600 ${
                priceInfo.isCombo ? 'text-sm' : 'text-base'
              }`}>
                {cardPriceText}
              </span>
              {priceInfo.isCombo && (
                <span className="ml-2 text-xs font-medium text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                  Combo
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DETAILS SECTION - Information and restaurant action */}
      <div className="space-y-4 border-t border-stone-100/60 bg-linear-to-b from-white to-stone-50/50 p-6">
        {/* Body content - Supporting details */}
        {body ? (
          <div className="rounded-2xl border border-stone-100/80 bg-stone-50/70 px-4 py-3">
            <p className="text-[13px] font-medium leading-6 text-stone-600">
              {body}
            </p>
          </div>
        ) : null}

        {/* Restaurant information - Clear and accessible */}
        {restaurants && restaurants.length > 0 && (
          <div className="pt-2 space-y-2">
            {restaurants.length === 1 ? (
              // Single restaurant
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">
                  📍 {restaurants[0].name}
                </span>
                <a
                  href={restaurants[0].mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-orange-200/80 bg-linear-to-r from-orange-50 to-amber-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition-all duration-200 hover:border-orange-300 hover:bg-white hover:shadow-md hover:text-orange-800"
                >
                  View Location
                </a>
              </div>
            ) : (
              // Multiple restaurants (combo recommendations)
              <div className="space-y-3">
                <div className="grid gap-2">
                  {restaurants.map((restaurant, index) => (
                    <div key={index} className="flex items-center justify-between bg-stone-50/50 rounded-lg p-3 border border-stone-100/50">
                      <span className="text-sm font-medium text-stone-700">
                        📍 {restaurant.name}
                      </span>
                      <a
                        href={restaurant.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-orange-200/80 bg-linear-to-r from-orange-50 to-amber-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition-all duration-200 hover:border-orange-300 hover:bg-white hover:shadow-md hover:text-orange-800"
                      >
                        View Map
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
