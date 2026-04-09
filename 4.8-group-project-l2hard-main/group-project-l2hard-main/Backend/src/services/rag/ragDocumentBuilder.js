const normalizeText = (value = '') =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const buildRestaurantContent = (restaurant) =>
  [
    `Restaurant: ${restaurant.name}`,
    `Original cuisines: ${(restaurant.cuisineTypes || []).join(', ') || 'unknown'}`,
    `Derived cuisines: ${(restaurant.derivedCuisineTypes || []).join(', ') || 'unknown'}`,
    `Derived food types: ${(restaurant.derivedFoodTypes || []).join(', ') || 'unknown'}`,
    `Supports food: ${restaurant.supportsFood ? 'yes' : 'no'}`,
    `Supports drink: ${restaurant.supportsDrink ? 'yes' : 'no'}`,
    `Price range: ${restaurant.priceRange || 'unknown'}`,
    `Rating: ${restaurant.rating ?? 'unknown'}`,
    `Address: ${restaurant.location?.address || 'unknown'}`,
    `Distance from campus: ${restaurant.location?.distanceFromCampus ?? 'unknown'}`,
    restaurant.isCampusVendor ? 'Campus vendor' : 'Off-campus vendor',
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join('. ');

const buildMenuContent = (menuItem, restaurant) =>
  [
    `Dish: ${menuItem.name}`,
    `Original category: ${menuItem.category || 'unknown'}`,
    `Normalized category: ${menuItem.normalizedCategory || 'unknown'}`,
    `Primary dish type: ${menuItem.primaryDishType || 'unknown'}`,
    `Dish types: ${(menuItem.dishTypes || []).join(', ') || 'none'}`,
    `Protein tags: ${(menuItem.proteinTags || []).join(', ') || 'none'}`,
    `Cuisine tags: ${(menuItem.cuisineTags || []).join(', ') || 'none'}`,
    `Main dish: ${menuItem.isMainDish ? 'yes' : 'no'}`,
    `Side: ${menuItem.isSide ? 'yes' : 'no'}`,
    `Addon: ${menuItem.isAddon ? 'yes' : 'no'}`,
    `Combo: ${menuItem.isCombo ? 'yes' : 'no'}`,
    `Supports food intent: ${menuItem.supportsFoodIntent ? 'yes' : 'no'}`,
    `Supports drink intent: ${menuItem.supportsDrinkIntent ? 'yes' : 'no'}`,
    `Restaurant: ${restaurant?.name || 'Unknown Restaurant'}`,
    `Restaurant cuisines: ${(restaurant?.derivedCuisineTypes || restaurant?.cuisineTypes || []).join(', ') || 'unknown'}`,
    `Price: ${menuItem.price ?? 'unknown'}`,
    `Rating: ${menuItem.rating ?? 'unknown'}`,
    `Restaurant price range: ${restaurant?.priceRange || 'unknown'}`,
    `Address: ${restaurant?.location?.address || 'unknown'}`,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join('. ');

export const buildRestaurantDocuments = (dataset = {}) =>
  (dataset.availableRestaurants || []).map((restaurant) => ({
    id: `restaurant:${String(restaurant._id)}`,
    type: 'restaurant',
    entityId: String(restaurant._id),
    content: buildRestaurantContent(restaurant),
    metadata: {
      restaurantId: String(restaurant._id),
      restaurantName: restaurant.name,
      cuisineTypes: restaurant.cuisineTypes || [],
      derivedCuisineTypes: restaurant.derivedCuisineTypes || [],
      derivedFoodTypes: restaurant.derivedFoodTypes || [],
      supportsFood: Boolean(restaurant.supportsFood),
      supportsDrink: Boolean(restaurant.supportsDrink),
      priceRange: restaurant.priceRange || 'unknown',
      rating: restaurant.rating ?? null,
      googleMapsUrl: restaurant.location?.googleMapsUrl || null,
      address: restaurant.location?.address || null,
      distanceFromCampus: restaurant.location?.distanceFromCampus ?? null,
    },
    descriptiveFields: {
      title: restaurant.name,
      subtitle: restaurant.location?.address || '',
      cuisineTypes: restaurant.derivedCuisineTypes || restaurant.cuisineTypes || [],
    },
    source: restaurant,
  }));

export const buildMenuItemDocuments = (dataset = {}) =>
  (dataset.availableMenuItems || []).map((menuItem) => {
    const restaurant = dataset.restaurantById?.get(menuItem.restaurantId);
    return {
      id: `menu:${menuItem.id}`,
      type: 'menu_item',
      entityId: menuItem.id,
      content: buildMenuContent(menuItem, restaurant),
      metadata: {
        menuId: menuItem.id,
        menuName: menuItem.name,
        restaurantId: menuItem.restaurantId,
        restaurantName: menuItem.restaurantName,
        category: menuItem.category || 'unknown',
        normalizedCategory: menuItem.normalizedCategory || 'unknown',
        primaryDishType: menuItem.primaryDishType || null,
        cuisineTypes: menuItem.restaurantDerivedCuisineTypes || menuItem.restaurantCuisineTypes || [],
        price: menuItem.price ?? null,
        priceRange: menuItem.restaurantPriceRange || 'unknown',
        rating: menuItem.rating ?? null,
        googleMapsUrl: menuItem.googleMapsUrl || null,
        address: menuItem.address || null,
        proteinTags: menuItem.proteinTags || [],
        dishTypes: menuItem.dishTypes || [],
        mealTags: menuItem.mealTags || [],
        isMainDish: Boolean(menuItem.isMainDish),
        isSide: Boolean(menuItem.isSide),
        isAddon: Boolean(menuItem.isAddon),
        isCombo: Boolean(menuItem.isCombo),
        supportsFoodIntent: Boolean(menuItem.supportsFoodIntent),
        supportsDrinkIntent: Boolean(menuItem.supportsDrinkIntent),
        containsSalad: Boolean(menuItem.containsSalad),
        containsNoodles: Boolean(menuItem.containsNoodles),
      },
      descriptiveFields: {
        title: menuItem.name,
        subtitle: menuItem.restaurantName,
        category: menuItem.normalizedCategory || menuItem.category || 'unknown',
      },
      source: menuItem,
    };
  });

export const buildRagDocuments = (dataset = {}) => ({
  restaurantDocuments: buildRestaurantDocuments(dataset),
  menuItemDocuments: buildMenuItemDocuments(dataset),
});
