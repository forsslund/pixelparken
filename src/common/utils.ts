/**
 * Common utility functions for Pixelparken
 */

export interface GameScore {
  gameName: string;
  score: number;
  timestamp: number;
}

/**
 * Save a score to localStorage
 */
export function saveScore(gameName: string, score: number): void {
  const key = `pixelparken_${gameName}_score`;
  const scoreData: GameScore = {
    gameName,
    score,
    timestamp: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(scoreData));
}

/**
 * Get the high score for a game
 */
export function getHighScore(gameName: string): number | null {
  const key = `pixelparken_${gameName}_score`;
  const data = localStorage.getItem(key);
  if (!data) return null;

  try {
    const scoreData: GameScore = JSON.parse(data);
    return scoreData.score;
  } catch {
    return null;
  }
}

/**
 * Format time as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
