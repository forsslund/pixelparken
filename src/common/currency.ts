/**
 * Currency system for Pixelparken
 * Handles large numbers with k, m, b, qa, qi formatting
 */

export interface CurrencyData {
  amount: number;
  multiplier: number;
}

/**
 * Format a number as currency with k, m, b, qa, qi suffixes
 * Examples:
 * 1000 -> 1k
 * 1500 -> 1.5k
 * 1000000 -> 1m
 * 9900000 -> 9.9m
 * 1000000000 -> 1b
 * 1000000000000 -> 1qa (quadrillion in short scale)
 * 1000000000000000 -> 1qi (quintillion in short scale)
 */
export function formatCurrency(amount: number): string {
  if (amount < 1000) {
    return `${Math.floor(amount)} kr`;
  }

  const units = [
    { value: 1e15, suffix: 'qi' }, // quintillion
    { value: 1e12, suffix: 'qa' }, // quadrillion
    { value: 1e9, suffix: 'b' },   // billion
    { value: 1e6, suffix: 'm' },   // million
    { value: 1e3, suffix: 'k' },   // thousand
  ];

  for (const unit of units) {
    if (amount >= unit.value) {
      const value = amount / unit.value;
      // Keep one decimal if it's not a whole number
      const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
      return `${formatted}${unit.suffix} kr`;
    }
  }

  return `${Math.floor(amount)} kr`;
}

/**
 * Get total currency from localStorage
 */
export function getTotalCurrency(): number {
  const stored = localStorage.getItem('pixelparken_total_kr');
  if (!stored) return 0;

  try {
    const data = JSON.parse(stored) as { amount?: number };
    return data.amount || 0;
  } catch {
    return 0;
  }
}

/**
 * Add currency to the total
 */
export function addCurrency(amount: number): number {
  const current = getTotalCurrency();
  const newTotal = current + amount;

  localStorage.setItem('pixelparken_total_kr', JSON.stringify({
    amount: newTotal,
    timestamp: Date.now(),
  }));

  return newTotal;
}

/**
 * Subtract currency (for purchases)
 * Returns true if successful, false if not enough currency
 */
export function subtractCurrency(amount: number): boolean {
  const current = getTotalCurrency();
  if (current < amount) {
    return false;
  }

  const newTotal = current - amount;
  localStorage.setItem('pixelparken_total_kr', JSON.stringify({
    amount: newTotal,
    timestamp: Date.now(),
  }));

  return true;
}

/**
 * Get current multiplier based on purchased items
 */
export function getCurrentMultiplier(): number {
  // Will be calculated based on purchased items from shop
  // Base multiplier is 1 (10 kr per correct answer)
  // This function will query the shop to get total multiplier
  const baseMultiplier = 10; // Base kr per correct answer

  // Import shop dynamically to avoid circular dependency
  // For now, return base multiplier
  // This will be updated when shop is implemented
  return baseMultiplier;
}

/**
 * Calculate earnings for correct answers
 */
export function calculateEarnings(correctAnswers: number, multiplier: number): number {
  return correctAnswers * multiplier;
}
