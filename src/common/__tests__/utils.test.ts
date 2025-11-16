import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveScore,
  getHighScore,
  formatTime,
  randomInt,
  shuffle,
} from '../utils';

describe('utils', () => {
  beforeEach(() => {
    // localStorage is cleared by vitest.setup.ts
  });

  describe('saveScore', () => {
    it('should save score to localStorage', () => {
      saveScore('tetris', 1000);

      const stored = localStorage.getItem('pixelparken_tetris_score');
      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.gameName).toBe('tetris');
        expect(parsed.score).toBe(1000);
        expect(parsed.timestamp).toBeTypeOf('number');
      }
    });
  });

  describe('getHighScore', () => {
    it('should return null if no score exists', () => {
      const score = getHighScore('nonexistent');
      expect(score).toBeNull();
    });

    it('should return saved score', () => {
      saveScore('memory', 500);
      const score = getHighScore('memory');
      expect(score).toBe(500);
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('pixelparken_broken_score', 'invalid json');
      const score = getHighScore('broken');
      expect(score).toBeNull();
    });
  });

  describe('formatTime', () => {
    it('should format seconds as MM:SS', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(5)).toBe('00:05');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(125)).toBe('02:05');
    });

    it('should pad single digits with zero', () => {
      expect(formatTime(9)).toBe('00:09');
      expect(formatTime(69)).toBe('01:09');
    });
  });

  describe('randomInt', () => {
    it('should return number within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 10);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
      }
    });

    it('should handle single value range', () => {
      const result = randomInt(5, 5);
      expect(result).toBe(5);
    });
  });

  describe('shuffle', () => {
    it('should return array with same length', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled).toHaveLength(original.length);
    });

    it('should contain all original elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled.sort()).toEqual(original);
    });

    it('should not mutate original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffle(original);
      expect(original).toEqual(originalCopy);
    });

    it('should shuffle array (probabilistic test)', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = shuffle(original);

      // Very unlikely to get exact same order after shuffle
      // (but not impossible, so this test could theoretically fail)
      const sameOrder = shuffled.every((val, idx) => val === original[idx]);
      expect(sameOrder).toBe(false);
    });
  });
});
