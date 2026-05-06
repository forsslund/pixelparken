import { describe, it, expect, beforeEach } from 'vitest';
import {
  canonicalKey,
  makeAllFacts,
  factWeight,
  selectNextFact,
  recordAttempt,
  isMastered,
  masteredCount,
  loadState,
  saveState,
  freshState,
  MASTERY_BOX,
  MAX_BOX,
  FLUENCY_MS,
} from '../scheduler';

describe('canonicalKey', () => {
  it('treats commutative pairs as equal', () => {
    expect(canonicalKey(4, 3)).toBe(canonicalKey(3, 4));
    expect(canonicalKey(7, 2)).toBe('2x7');
    expect(canonicalKey(5, 5)).toBe('5x5');
  });
});

describe('makeAllFacts', () => {
  it('produces exactly 55 unique facts (1..10, commutative collapsed)', () => {
    const facts = makeAllFacts();
    expect(facts).toHaveLength(55);

    const keys = new Set(facts.map((f) => canonicalKey(f.a, f.b)));
    expect(keys.size).toBe(55);
  });

  it('produces 15 facts for the 1..5 range', () => {
    const facts = makeAllFacts(5);
    expect(facts).toHaveLength(15);
    for (const f of facts) {
      expect(f.a).toBeLessThanOrEqual(f.b);
      expect(f.b).toBeLessThanOrEqual(5);
    }
  });

  it('canonicalizes so a <= b in every fact', () => {
    for (const f of makeAllFacts()) {
      expect(f.a).toBeLessThanOrEqual(f.b);
      expect(f.a).toBeGreaterThanOrEqual(1);
      expect(f.b).toBeLessThanOrEqual(10);
    }
  });

  it('initializes all stat fields to zero', () => {
    for (const f of makeAllFacts()) {
      expect(f.attempts).toBe(0);
      expect(f.errorAttempts).toBe(0);
      expect(f.errorKeystrokes).toBe(0);
      expect(f.totalTimeMs).toBe(0);
      expect(f.box).toBe(0);
      expect(f.lastSeen).toBe(0);
    }
  });
});

describe('factWeight', () => {
  it('gives new facts a high weight', () => {
    const facts = makeAllFacts();
    const newFact = facts[0];
    const w = factWeight(newFact, 1_000_000);
    expect(w).toBeGreaterThan(2);
  });

  it('penalises slow facts more than fast ones', () => {
    const fast = makeAllFacts()[0];
    const slow = makeAllFacts()[0];

    recordAttempt(fast, 800, 0, 0);
    recordAttempt(slow, 4000, 0, 0);

    // Same time of evaluation, both seen long ago.
    const now = 1_000_000_000;
    expect(factWeight(slow, now)).toBeGreaterThan(factWeight(fast, now));
  });

  it('penalises facts with errors', () => {
    const clean = makeAllFacts()[0];
    const errored = makeAllFacts()[0];

    recordAttempt(clean, 1500, 0, 0);
    recordAttempt(errored, 1500, 2, 0);

    const now = 1_000_000_000;
    expect(factWeight(errored, now)).toBeGreaterThan(factWeight(clean, now));
  });

  it('damps recently-seen facts', () => {
    const fact = makeAllFacts()[0];
    recordAttempt(fact, 1500, 0, 1_000_000);

    const justAfter = factWeight(fact, 1_000_500); // 0.5s later
    const muchLater = factWeight(fact, 1_000_000 + 60_000); // 60s later
    expect(muchLater).toBeGreaterThan(justAfter);
  });
});

describe('recordAttempt', () => {
  it('promotes box on a fast, error-free attempt', () => {
    const f = makeAllFacts()[0];
    expect(f.box).toBe(0);
    recordAttempt(f, FLUENCY_MS - 500, 0, 0);
    expect(f.box).toBe(1);
  });

  it('does not promote on slow attempts even if correct', () => {
    const f = makeAllFacts()[0];
    recordAttempt(f, FLUENCY_MS + 500, 0, 0);
    expect(f.box).toBe(0);
  });

  it('demotes on any error keystroke', () => {
    const f = makeAllFacts()[0];
    f.box = 3;
    recordAttempt(f, 1000, 1, 0);
    expect(f.box).toBe(2);
    expect(f.errorAttempts).toBe(1);
    expect(f.errorKeystrokes).toBe(1);
  });

  it('floors box at 0', () => {
    const f = makeAllFacts()[0];
    recordAttempt(f, 1000, 1, 0);
    expect(f.box).toBe(0);
  });

  it('caps box at MAX_BOX', () => {
    const f = makeAllFacts()[0];
    f.box = MAX_BOX;
    recordAttempt(f, 500, 0, 0);
    expect(f.box).toBe(MAX_BOX);
  });

  it('tracks best time across attempts', () => {
    const f = makeAllFacts()[0];
    recordAttempt(f, 2000, 0, 0);
    recordAttempt(f, 1500, 0, 0);
    recordAttempt(f, 1800, 0, 0);
    expect(f.bestTimeMs).toBe(1500);
  });
});

describe('selectNextFact', () => {
  it('returns a valid fact from the array', () => {
    const facts = makeAllFacts();
    const picked = selectNextFact(facts, 1_000_000, () => 0.5);
    expect(facts).toContain(picked);
  });

  it('avoids picking the most-recent fact when other options exist', () => {
    const facts = makeAllFacts();
    // Make all facts well-rested except one just seen.
    const now = 1_000_000;
    for (const f of facts) {
      recordAttempt(f, 1000, 0, now - 60_000);
    }
    const justSeen = facts[0];
    justSeen.lastSeen = now - 100; // 0.1s ago

    let pickedJustSeen = 0;
    let rng = 0;
    const seqRandom = (): number => {
      const v = (rng * 9301 + 49297) % 233280;
      rng = v;
      return v / 233280;
    };
    for (let i = 0; i < 200; i++) {
      const p = selectNextFact(facts, now, seqRandom);
      if (p === justSeen) pickedJustSeen++;
    }
    // Should be picked far less than uniform (1/55 ≈ 3.6 of 200).
    expect(pickedJustSeen).toBeLessThan(10);
  });

  it('throws on empty array', () => {
    expect(() => selectNextFact([], 0)).toThrow();
  });
});

describe('mastery', () => {
  it('isMastered reflects the MASTERY_BOX threshold', () => {
    const f = makeAllFacts()[0];
    f.box = MASTERY_BOX - 1;
    expect(isMastered(f)).toBe(false);
    f.box = MASTERY_BOX;
    expect(isMastered(f)).toBe(true);
  });

  it('masteredCount counts only mastered facts', () => {
    const facts = makeAllFacts();
    facts[0].box = MASTERY_BOX;
    facts[1].box = MASTERY_BOX + 1;
    facts[2].box = MASTERY_BOX - 1;
    expect(masteredCount(facts)).toBe(2);
  });
});

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns fresh state when nothing is stored', () => {
    const state = loadState();
    expect(state.version).toBe(1);
    expect(state.facts).toHaveLength(55);
    expect(state.sessionsCompleted).toBe(0);
  });

  it('round-trips state through save/load', () => {
    const state = freshState();
    state.facts[0].box = 3;
    state.facts[0].attempts = 12;
    state.sessionsCompleted = 2;
    saveState(state);

    const loaded = loadState();
    const f = loaded.facts.find((x) => x.a === state.facts[0].a && x.b === state.facts[0].b);
    expect(f?.box).toBe(3);
    expect(f?.attempts).toBe(12);
    expect(loaded.sessionsCompleted).toBe(2);
  });

  it('falls back to fresh state on corrupt JSON', () => {
    localStorage.setItem('gangertabellen-stats-v1', 'not json');
    const loaded = loadState();
    expect(loaded.facts).toHaveLength(55);
  });

  it('keeps progress for separate storage keys independent', () => {
    const big = freshState(10);
    big.facts[0].box = 4;
    saveState(big, 'gangertabellen-stats-v1');

    const small = freshState(5);
    small.facts[0].box = 2;
    saveState(small, 'gangertabellen-liten-stats-v1');

    const loadedBig = loadState('gangertabellen-stats-v1', 10);
    const loadedSmall = loadState('gangertabellen-liten-stats-v1', 5);

    expect(loadedBig.facts).toHaveLength(55);
    expect(loadedSmall.facts).toHaveLength(15);
    expect(loadedBig.facts[0].box).toBe(4);
    expect(loadedSmall.facts[0].box).toBe(2);
  });
});
