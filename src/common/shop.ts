/**
 * Shop system for Pixelparken
 * Handles purchasable items and multipliers
 */

import { getTotalCurrency, subtractCurrency } from './currency';

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  multiplier: number;
  icon: string;
  description: string;
  visualEffect: 'gold-clock' | 'common-car' | 'lamborghini' | 'iron' | 'galaxy';
}

/**
 * All available shop items
 */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'gold-clock',
    name: 'Guld Klocka',
    price: 50,
    multiplier: 1000,
    icon: '🏆',
    description: 'Din första upgrade! Klockan blir gyllene.',
    visualEffect: 'gold-clock',
  },
  {
    id: 'common-car',
    name: 'Common Car',
    price: 100_000,
    multiplier: 10_000,
    icon: '🚗',
    description: 'En vanlig bil som ökar dina intäkter!',
    visualEffect: 'common-car',
  },
  {
    id: 'lamborghini',
    name: 'Lamborghini',
    price: 1_000_000,
    multiplier: 100_000,
    icon: '🏎️',
    description: 'En röd Lamborghini! Nu tjänar du mycket mer.',
    visualEffect: 'lamborghini',
  },
  {
    id: 'iron-lamborghini',
    name: 'Järn Lamborghini',
    price: 9_900_000,
    multiplier: 1_000_000,
    icon: '🔩',
    description: 'En metallic Lamborghini i järn. Exakt 9.9m kr!',
    visualEffect: 'iron',
  },
  {
    id: 'galaxy-lamborghini',
    name: 'GALAXY Lamborghini',
    price: 2_500_000_000,
    multiplier: 100_000_000,
    icon: '🌌',
    description: 'Den ultimata bilen från rymden!',
    visualEffect: 'galaxy',
  },
];

/**
 * Get purchased items from localStorage
 */
export function getPurchasedItems(): string[] {
  const stored = localStorage.getItem('pixelparken_purchased_items');
  if (!stored) return [];

  try {
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

/**
 * Check if an item has been purchased
 */
export function hasItem(itemId: string): boolean {
  const purchased = getPurchasedItems();
  return purchased.includes(itemId);
}

/**
 * Check if user can afford an item
 */
export function canAfford(itemId: string): boolean {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return false;

  const currency = getTotalCurrency();
  return currency >= item.price;
}

/**
 * Purchase an item
 * Returns true if successful, false if already owned or not enough currency
 */
export function purchaseItem(itemId: string): boolean {
  // Check if already purchased
  if (hasItem(itemId)) {
    return false;
  }

  // Get item
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) {
    return false;
  }

  // Check if can afford
  if (!canAfford(itemId)) {
    return false;
  }

  // Subtract currency
  if (!subtractCurrency(item.price)) {
    return false;
  }

  // Add to purchased items
  const purchased = getPurchasedItems();
  purchased.push(itemId);
  localStorage.setItem('pixelparken_purchased_items', JSON.stringify(purchased));

  return true;
}

/**
 * Get the total multiplier from all purchased items
 * Uses the HIGHEST multiplier, not stacking
 */
export function getTotalMultiplier(): number {
  const purchased = getPurchasedItems();
  let bestMultiplier = 1; // Base multiplier (no items)

  // Find the highest multiplier among purchased items
  for (const itemId of purchased) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (item && item.multiplier > bestMultiplier) {
      bestMultiplier = item.multiplier;
    }
  }

  return 10 * bestMultiplier; // Base 10 kr × best multiplier
}

/**
 * Get the next affordable item that hasn't been purchased
 */
export function getNextItem(): ShopItem | null {
  const purchased = getPurchasedItems();

  for (const item of SHOP_ITEMS) {
    if (!purchased.includes(item.id)) {
      return item;
    }
  }

  return null;
}

/**
 * Get visual effect for the clock based on purchased items
 */
export function getClockVisualEffect(): 'gold-clock' | 'common-car' | 'lamborghini' | 'iron' | 'galaxy' | 'default' {
  const purchased = getPurchasedItems();

  // Return the highest tier visual effect
  if (purchased.includes('galaxy-lamborghini')) {
    return 'galaxy';
  }
  if (purchased.includes('iron-lamborghini')) {
    return 'iron';
  }
  if (purchased.includes('lamborghini')) {
    return 'lamborghini';
  }
  if (purchased.includes('common-car')) {
    return 'common-car';
  }
  if (purchased.includes('gold-clock')) {
    return 'gold-clock';
  }

  return 'default';
}
