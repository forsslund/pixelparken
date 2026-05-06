import { describe, it, expect, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { GangertabellenGame } from '../../gangertabellen/GangertabellenGame';

describe('GangertabellenGame (Lilla variant)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('constructs with a custom maxFactor and storageKey', () => {
    const scene = new GangertabellenGame({
      sceneKey: 'GangertabellenLitenGame',
      maxFactor: 5,
      storageKey: 'gangertabellen-liten-stats-v1',
      title: '🌱 Lilla gångertabellen',
    });
    expect(scene).toBeInstanceOf(Phaser.Scene);
  });

  it('uses a different scene key than the default', () => {
    const small = new GangertabellenGame({
      sceneKey: 'GangertabellenLitenGame',
      maxFactor: 5,
      storageKey: 'gangertabellen-liten-stats-v1',
    });
    const big = new GangertabellenGame();
    // Phaser stores the key on settings; we just need them distinct.
    expect((small as unknown as { sys: { settings: { key: string } } }).sys.settings.key).toBe(
      'GangertabellenLitenGame'
    );
    expect((big as unknown as { sys: { settings: { key: string } } }).sys.settings.key).toBe(
      'GangertabellenGame'
    );
  });
});
