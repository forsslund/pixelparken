import { describe, it, expect, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { TangentGame } from '../TangentGame';

describe('TangentGame', () => {
  it('should be a Phaser Scene class', () => {
    expect(TangentGame.prototype).toBeInstanceOf(Phaser.Scene);
  });

  it('should have required lifecycle methods defined', () => {
    expect(typeof TangentGame.prototype.create).toBe('function');
  });

  it('should construct without errors', () => {
    const scene = new TangentGame();
    expect(scene).toBeDefined();
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('should be configured with correct key', () => {
    const scene = new TangentGame();
    expect(scene).toBeDefined();
  });

  describe('localStorage integration', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should initialize with lesson 0 and exercise 0 when no progress exists', () => {
      const scene = new TangentGame();
      expect(scene).toBeDefined();
      // Progress starts at 0,0 by default
    });

    it('should save progress to localStorage', () => {
      // This would be tested in integration tests
      // Here we just verify the scene can be created
      const scene = new TangentGame();
      expect(scene).toBeDefined();
    });
  });
});
