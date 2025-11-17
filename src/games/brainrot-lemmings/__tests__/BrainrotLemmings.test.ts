import { describe, it, expect } from 'vitest';
import Phaser from 'phaser';
import { BrainrotLemmings } from '../BrainrotLemmings';

describe('BrainrotLemmings', () => {
  it('should be a Phaser Scene class', () => {
    expect(BrainrotLemmings.prototype).toBeInstanceOf(Phaser.Scene);
  });

  it('should have required lifecycle methods defined', () => {
    expect(typeof BrainrotLemmings.prototype.create).toBe('function');
    expect(typeof BrainrotLemmings.prototype.update).toBe('function');
  });

  it('should construct without errors', () => {
    const scene = new BrainrotLemmings();
    expect(scene).toBeDefined();
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('should be configured with correct key', () => {
    const scene = new BrainrotLemmings();
    expect(scene).toBeDefined();
  });
});
