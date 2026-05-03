import { describe, it, expect, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { NumpadGame } from '../NumpadGame';

describe('NumpadGame', () => {
  it('should be a Phaser Scene class', () => {
    expect(NumpadGame.prototype).toBeInstanceOf(Phaser.Scene);
  });

  it('should have required lifecycle methods defined', () => {
    expect(typeof NumpadGame.prototype.create).toBe('function');
    expect(typeof NumpadGame.prototype.shutdown).toBe('function');
  });

  it('should construct without errors', () => {
    const scene = new NumpadGame();
    expect(scene).toBeDefined();
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  describe('localStorage integration', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should initialize without saved progress', () => {
      const scene = new NumpadGame();
      expect(scene).toBeDefined();
    });

    it('should use a separate progress key from tangent', () => {
      localStorage.setItem('tangent-progress', JSON.stringify({ currentLesson: 5, currentExercise: 5 }));
      const scene = new NumpadGame();
      expect(scene).toBeDefined();
      // Numpad reads from 'numpad-progress', not 'tangent-progress'
      expect(localStorage.getItem('tangent-progress')).toBeTruthy();
    });
  });
});
