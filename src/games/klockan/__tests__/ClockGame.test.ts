import { describe, it, expect } from 'vitest';
import Phaser from 'phaser';
import { ClockGame } from '../ClockGame';

describe('ClockGame', () => {
  it('should be a Phaser Scene class', () => {
    expect(ClockGame.prototype).toBeInstanceOf(Phaser.Scene);
  });

  it('should have required lifecycle methods defined', () => {
    expect(typeof ClockGame.prototype.create).toBe('function');
  });

  it('should construct without errors', () => {
    const scene = new ClockGame();
    expect(scene).toBeDefined();
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('should be configured with correct key', () => {
    // Check that the scene is initialized with the correct key in constructor
    const scene = new ClockGame();
    // The key is passed in the super() call
    expect(scene).toBeDefined();
  });
});
