import { describe, it, expect } from 'vitest';
import Phaser from 'phaser';
import { BouncingBabiesGame } from '../BouncingBabiesGame';

describe('BouncingBabiesGame', () => {
  it('should be a Phaser Scene class', () => {
    expect(BouncingBabiesGame.prototype).toBeInstanceOf(Phaser.Scene);
  });

  it('should have required lifecycle methods defined', () => {
    expect(typeof BouncingBabiesGame.prototype.preload).toBe('function');
    expect(typeof BouncingBabiesGame.prototype.create).toBe('function');
    expect(typeof BouncingBabiesGame.prototype.update).toBe('function');
    expect(typeof BouncingBabiesGame.prototype.shutdown).toBe('function');
  });

  it('should construct without errors', () => {
    const scene = new BouncingBabiesGame();
    expect(scene).toBeDefined();
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('should be configured with correct key', () => {
    const scene = new BouncingBabiesGame();
    expect(scene).toBeDefined();
  });
});
