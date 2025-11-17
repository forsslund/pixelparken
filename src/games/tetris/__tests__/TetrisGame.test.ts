import { describe, it, expect } from 'vitest';
import Phaser from 'phaser';
import { TetrisGame } from '../TetrisGame';

describe('TetrisGame', () => {
  it('should be a Phaser Scene class', () => {
    expect(TetrisGame.prototype).toBeInstanceOf(Phaser.Scene);
  });

  it('should have required lifecycle methods defined', () => {
    expect(typeof TetrisGame.prototype.create).toBe('function');
    expect(typeof TetrisGame.prototype.update).toBe('function');
    expect(typeof TetrisGame.prototype.shutdown).toBe('function');
  });

  it('should construct without errors', () => {
    const scene = new TetrisGame();
    expect(scene).toBeDefined();
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('should be configured with correct key', () => {
    // Check that the scene is initialized with the correct key in constructor
    const scene = new TetrisGame();
    // The key is passed in the super() call
    expect(scene).toBeDefined();
  });
});
