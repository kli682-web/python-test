import Restaurant from '../models/Restaurant.model.js';
import Menu from '../models/Menu.model.js';
import { deriveRestaurantMetadata, normalizeMenuMetadata } from './normalization.service.js';

export const loadDataset = async () => {
  const [restaurantData, menuData] = await Promise.all([
    Restaurant.find({ isAvailable: true }).lean(),
    Menu.find({ isAvailable: true }).lean(),
  ]);

  const restaurantById = new Map(
    restaurantData.map((restaurant) => [String(restaurant._id), restaurant])
  );

  const normalizedMenuItems = menuData.map((item) => {
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
      mapUrl: restaurant?.location?.googleMapsUrl ?? null,
      address: restaurant?.location?.address ?? null,
      ...normalized,
    };
  });

  const normalizedMenuByRestaurantId = new Map();
  normalizedMenuItems.forEach((item) => {
    const key = String(item.restaurantId);
    const bucket = normalizedMenuByRestaurantId.get(key) || [];
    bucket.push(item);
    normalizedMenuByRestaurantId.set(key, bucket);
  });

  const availableRestaurants = restaurantData.map((restaurant) => {
    const normalizedMenus = normalizedMenuByRestaurantId.get(String(restaurant._id)) || [];
    const derived = deriveRestaurantMetadata(restaurant, normalizedMenus);
    return {
      ...restaurant,
      ...derived,
    };
  });

  const normalizedRestaurantById = new Map(
    availableRestaurants.map((restaurant) => [String(restaurant._id), restaurant])
  );

  const availableMenuItems = normalizedMenuItems.map((item) => {
    const restaurant = normalizedRestaurantById.get(String(item.restaurantId));
    return {
      ...item,
      restaurantCuisineTypes: restaurant?.cuisineTypes ?? item.restaurantCuisineTypes,
      restaurantDerivedCuisineTypes: restaurant?.derivedCuisineTypes ?? item.restaurantDerivedCuisineTypes,
    };
  });

  const menuItemById = new Map(availableMenuItems.map((item) => [String(item.id), item]));
  const menuItemsByRestaurantId = new Map();
  availableMenuItems.forEach((item) => {
    const key = String(item.restaurantId);
    const bucket = menuItemsByRestaurantId.get(key) || [];
    bucket.push(item);
    menuItemsByRestaurantId.set(key, bucket);
  });

  return {
    restaurantData: availableRestaurants,
    menuData,
    restaurantById: normalizedRestaurantById,
    menuItemById,
    menuItemsByRestaurantId,
    availableRestaurants,
    availableMenuItems,
  };
};

const countIntentSignals = [
  'how many',
  'count',
  'number of',
];

const restaurantIntentSignals = [
  'restaurant',
  'restaurants',
  'shop',
  'shops',
  'store',
  'stores',
];

const menuIntentSignals = [
  'menu',
  'menus',
  'dish',
  'dishes',
  'item',
  'items',
  'food',
  'foods',
  'drink',
  'drinks',
];

export const getLatestUserMessage = (messages = []) =>
  [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';

export const detectDatasetCountIntent = (message = '') => {
  const normalized = String(message || '').toLowerCase();
  const wantsCount = countIntentSignals.some((signal) => normalized.includes(signal));

  if (!wantsCount) return null;
  if (restaurantIntentSignals.some((signal) => normalized.includes(signal))) return 'restaurant';
  if (menuIntentSignals.some((signal) => normalized.includes(signal))) return 'menu';

  return null;
};

export const buildDatasetCountReply = (dataset, intent) => {
  const restaurantCount = dataset?.availableRestaurants?.length ?? 0;
  const menuCount = dataset?.availableMenuItems?.length ?? 0;

  if (intent === 'restaurant') {
    return `I currently have ${restaurantCount} available restaurants in MongoDB for this request.`;
  }

  if (intent === 'menu') {
    return `I currently have ${menuCount} available menu items in MongoDB for this request.`;
  }

  return `I currently have ${restaurantCount} available restaurants and ${menuCount} available menu items in MongoDB for this request.`;
};