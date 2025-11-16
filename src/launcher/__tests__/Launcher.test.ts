import { describe, it, expect, beforeEach } from 'vitest';
import { Launcher } from '../Launcher';

describe('Launcher', () => {
  let launcher: Launcher;

  beforeEach(() => {
    launcher = new Launcher();
  });

  it('should create launcher instance', () => {
    expect(launcher).toBeDefined();
  });

  it('should return list of games', () => {
    const games = launcher.getGames();
    expect(games).toBeInstanceOf(Array);
    expect(games.length).toBeGreaterThan(0);
  });

  it('should have educational games', () => {
    const educationalGames = launcher.getGamesByCategory('educational');
    expect(educationalGames.length).toBeGreaterThan(0);
  });

  it('should return games with required properties', () => {
    const games = launcher.getGames();

    games.forEach(game => {
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('name');
      expect(game).toHaveProperty('description');
      expect(game).toHaveProperty('category');
      expect(game).toHaveProperty('icon');
      expect(game).toHaveProperty('path');

      expect(typeof game.id).toBe('string');
      expect(typeof game.name).toBe('string');
      expect(typeof game.description).toBe('string');
      expect(['educational', 'fun']).toContain(game.category);
    });
  });

  it('should filter games by category correctly', () => {
    const educationalGames = launcher.getGamesByCategory('educational');
    const funGames = launcher.getGamesByCategory('fun');

    educationalGames.forEach(game => {
      expect(game.category).toBe('educational');
    });

    funGames.forEach(game => {
      expect(game.category).toBe('fun');
    });
  });
});
