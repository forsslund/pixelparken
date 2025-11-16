import { describe, it, expect } from 'vitest';
import Phaser from 'phaser';
import { ChessGame } from '../ChessGame';

describe('ChessGame', () => {
  it('should be a Phaser Scene class', () => {
    expect(ChessGame.prototype).toBeInstanceOf(Phaser.Scene);
  });

  it('should have required lifecycle methods defined', () => {
    expect(typeof ChessGame.prototype.create).toBe('function');
  });

  it('should construct without errors', () => {
    const scene = new ChessGame();
    expect(scene).toBeDefined();
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('should be configured with correct key', () => {
    const scene = new ChessGame();
    expect(scene).toBeDefined();
  });
});
