import { describe, it, expect, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { GangertabellenGame } from '../../gangertabellen/GangertabellenGame';
import { makeAdditionFacts } from '../../gangertabellen/scheduler';

describe('Lilla plusspelet (addition variant)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('constructs with addition operation and a triangular grid layout', () => {
    const scene = new GangertabellenGame({
      sceneKey: 'LillaPlusspeletGame',
      storageKey: 'lilla-plusspelet-stats-v1',
      title: '➕ Lilla plusspelet',
      operation: 'add',
      factBuilder: () => makeAdditionFacts(10, false),
      gridLayout: {
        rowMin: 1,
        rowMax: 9,
        colMin: 1,
        colMax: 9,
        cellExists: (a, b) => a + b <= 10,
      },
    });
    expect(scene).toBeInstanceOf(Phaser.Scene);
    expect((scene as unknown as { sys: { settings: { key: string } } }).sys.settings.key).toBe(
      'LillaPlusspeletGame'
    );
  });

  it('produces 25 unique addition facts for sum<=10 without zero', () => {
    const facts = makeAdditionFacts(10, false);
    expect(facts).toHaveLength(25);
    for (const f of facts) {
      expect(f.a).toBeGreaterThanOrEqual(1);
      expect(f.b).toBeGreaterThanOrEqual(f.a);
      expect(f.a + f.b).toBeLessThanOrEqual(10);
    }
  });
});
