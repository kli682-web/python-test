import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { deriveRestaurantMetadata, normalizeMenuMetadata } from '../services/normalization.service.js';
import { retrieveCandidates } from '../services/rag/retriever.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../original_data');

const loadLocalDataset = async () => {
  const [restaurantRaw, menuRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, 'restaurant.json'), 'utf8'),
    fs.readFile(path.join(dataDir, 'menu.json'), 'utf8'),
  ]);

  const restaurantData = JSON.parse(restaurantRaw);
  const menuData = JSON.parse(menuRaw);
  const restaurantById = new Map(restaurantData.map((restaurant) => [String(restaurant._id), restaurant]));

  const normalizedMenus = menuData
    .filter((item) => item.isAvailable !== false)
    .map((item) => {
      const restaurant = restaurantById.get(String(item.restaurantId));
      const normalized = normalizeMenuMetadata(item, restaurant || {});
      return {
        id: String(item._id),
        name: item.name,
        category: item.category,
        price: item.price,
        rating: item.rating,
        restaurantId: String(item.restaurantId),
        restaurantName: restaurant?.name ?? 'Unknown Restaurant',
        restaurantCuisineTypes: restaurant?.cuisineTypes ?? [],
        restaurantDerivedCuisineTypes: restaurant?.derivedCuisineTypes ?? [],
        restaurantPriceRange: restaurant?.priceRange ?? 'unknown',
        googleMapsUrl: restaurant?.location?.googleMapsUrl ?? null,
        address: restaurant?.location?.address ?? null,
        ...normalized,
      };
    });

  const menuByRestaurant = new Map();
  normalizedMenus.forEach((item) => {
    const bucket = menuByRestaurant.get(String(item.restaurantId)) || [];
    bucket.push(item);
    menuByRestaurant.set(String(item.restaurantId), bucket);
  });

  const availableRestaurants = restaurantData
    .filter((restaurant) => restaurant.isAvailable !== false)
    .map((restaurant) => ({
      ...restaurant,
      ...deriveRestaurantMetadata(restaurant, menuByRestaurant.get(String(restaurant._id)) || []),
    }));

  const normalizedRestaurantById = new Map(availableRestaurants.map((restaurant) => [String(restaurant._id), restaurant]));
  const availableMenuItems = normalizedMenus.map((item) => ({
    ...item,
    restaurantDerivedCuisineTypes: normalizedRestaurantById.get(String(item.restaurantId))?.derivedCuisineTypes || item.restaurantDerivedCuisineTypes,
  }));

  return {
    availableRestaurants,
    availableMenuItems,
    restaurantById: normalizedRestaurantById,
    menuItemById: new Map(availableMenuItems.map((item) => [String(item.id), item])),
    menuItemsByRestaurantId: menuByRestaurant,
  };
};

const queries = [
  'i want to eat steak and have 15 budget, give recommend',
  'I have 15 dollars, want to eat salad, give me recommendation',
  'i want to eat noodles with japanese cuisine',
  'cheap chicken lunch under 12',
  'bubble tea under 8',
];

const dataset = await loadLocalDataset();
for (const query of queries) {
  const result = await retrieveCandidates({ dataset, latestUserMessage: query, debug: true });
  console.log(`\nQUERY: ${query}`);
  console.log(`Constraint mode: ${result.debug.activeConstraintMode}`);
  console.log(result.topMenuCandidates.slice(0, 3).map((item, index) => `${index + 1}. ${item.name} | ${item.restaurantName} | $${item.price} | ${item.primaryDishType} | proteins=${(item.proteinTags || []).join(',')}`).join('\n') || 'No candidates');
}
