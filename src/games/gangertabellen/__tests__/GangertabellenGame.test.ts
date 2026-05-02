import { describe, it, expect, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { GangertabellenGame } from '../GangertabellenGame';

describe('GangertabellenGame', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is a Phaser scene class', () => {
    expect(GangertabellenGame.prototype).toBeInstanceOf(Phaser.Scene);
  });

  it('exposes the expected lifecycle methods', () => {
    expect(typeof GangertabellenGame.prototype.create).toBe('function');
    expect(typeof GangertabellenGame.prototype.shutdown).toBe('function');
  });

  it('constructs without errors', () => {
    const scene = new GangertabellenGame();
    expect(scene).toBeDefined();
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });
});
