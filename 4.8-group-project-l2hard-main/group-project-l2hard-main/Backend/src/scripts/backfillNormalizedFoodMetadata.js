import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Menu from '../models/Menu.model.js';
import Restaurant from '../models/Restaurant.model.js';
import { deriveRestaurantMetadata, normalizeMenuMetadata } from '../services/normalization.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDryRun = process.argv.includes('--dry-run');
const dataDir = path.resolve(__dirname, '../../original_data');

const buildPreviewFromJson = async () => {
  const [restaurants, menus] = await Promise.all([
    fs.readFile(path.join(dataDir, 'restaurant.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(dataDir, 'menu.json'), 'utf8').then(JSON.parse),
  ]);
  const restaurantById = new Map(restaurants.map((restaurant) => [String(restaurant._id), restaurant]));
  const normalizedMenus = menus.slice(0, 20).map((menu) => ({
    originalId: String(menu._id),
    restaurantId: String(menu.restaurantId),
    normalized: normalizeMenuMetadata(menu, restaurantById.get(String(menu.restaurantId)) || {}),
  }));
  const menuMap = new Map();
  normalizedMenus.forEach((item) => {
    const bucket = menuMap.get(item.restaurantId) || [];
    bucket.push(item.normalized);
    menuMap.set(item.restaurantId, bucket);
  });
  const restaurantPreview = restaurants.slice(0, 5).map((restaurant) => ({
    id: String(restaurant._id),
    derived: deriveRestaurantMetadata(restaurant, menuMap.get(String(restaurant._id)) || []),
  }));
  return { menuPreview: normalizedMenus.slice(0, 10), restaurantPreview };
};

const main = async () => {
  if (isDryRun && !process.env.MONGODB_URI) {
    console.log(JSON.stringify(await buildPreviewFromJson(), null, 2));
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in .env to run the database backfill. Use --dry-run for a JSON preview.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const [restaurants, menus] = await Promise.all([Restaurant.find({}).lean(), Menu.find({}).lean()]);
  const restaurantById = new Map(restaurants.map((restaurant) => [String(restaurant._id), restaurant]));
  const normalizedMenus = menus.map((menu) => ({
    originalId: String(menu._id),
    restaurantId: String(menu.restaurantId),
    normalized: normalizeMenuMetadata(menu, restaurantById.get(String(menu.restaurantId)) || {}),
  }));

  const menuUpdates = normalizedMenus.map((item) => ({
    updateOne: { filter: { _id: item.originalId }, update: { $set: item.normalized } },
  }));

  const menuMap = new Map();
  normalizedMenus.forEach((item) => {
    const bucket = menuMap.get(item.restaurantId) || [];
    bucket.push(item.normalized);
    menuMap.set(item.restaurantId, bucket);
  });

  const restaurantUpdates = restaurants.map((restaurant) => ({
    updateOne: {
      filter: { _id: restaurant._id },
      update: { $set: deriveRestaurantMetadata(restaurant, menuMap.get(String(restaurant._id)) || []) },
    },
  }));

  if (isDryRun) {
    console.log(JSON.stringify({ menuPreview: normalizedMenus.slice(0, 10), restaurantPreview: restaurantUpdates.slice(0, 5) }, null, 2));
  } else {
    if (menuUpdates.length) await Menu.bulkWrite(menuUpdates);
    if (restaurantUpdates.length) await Restaurant.bulkWrite(restaurantUpdates);
    console.log(`Updated ${menuUpdates.length} menus and ${restaurantUpdates.length} restaurants.`);
  }

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
