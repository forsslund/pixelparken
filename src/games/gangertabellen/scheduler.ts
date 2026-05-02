/**
 * Gångertabellen — scheduler & per-fact statistics.
 *
 * Maintains Leitner-box state for each multiplication fact in 1×1..10×10
 * (treating commutative pairs as one fact) and selects the next fact via
 * weighted random sampling. See RATIONALE.md for pedagogical motivation.
 */

export interface FactStat {
  /** Smaller factor (canonical form, a <= b). */
  a: number;
  /** Larger factor. */
  b: number;
  /** Total completed attempts. */
  attempts: number;
  /** Attempts that contained at least one wrong keystroke. */
  errorAttempts: number;
  /** Total wrong keystrokes across all attempts. */
  errorKeystrokes: number;
  /** Sum of response times (ms), for averaging. */
  totalTimeMs: number;
  /** Most recent response time (ms). */
  lastTimeMs: number;
  /** Best (lowest) response time (ms); 0 if no successful attempts. */
  bestTimeMs: number;
  /** Leitner box level: 0 (new) → MAX_BOX (mastered). */
  box: number;
  /** Timestamp of last presentation (ms since epoch). */
  lastSeen: number;
}

export const MAX_BOX = 5;
/** Box level at which a fact counts as mastered. */
export const MASTERY_BOX = 4;
/** Response-time threshold below which a correct attempt promotes the box. */
export const FLUENCY_MS = 3000;

export function canonicalKey(a: number, b: number): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `${lo}x${hi}`;
}

/** Build a fresh array containing all 55 unique facts (1×1..10×10, commutative). */
export function makeAllFacts(): FactStat[] {
  const facts: FactStat[] = [];
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) {
      facts.push({
        a,
        b,
        attempts: 0,
        errorAttempts: 0,
        errorKeystrokes: 0,
        totalTimeMs: 0,
        lastTimeMs: 0,
        bestTimeMs: 0,
        box: 0,
        lastSeen: 0,
      });
    }
  }
  return facts;
}

export function isMastered(f: FactStat): boolean {
  return f.box >= MASTERY_BOX;
}

export function avgTimeMs(f: FactStat): number {
  return f.attempts === 0 ? 0 : f.totalTimeMs / f.attempts;
}

export function errorRate(f: FactStat): number {
  return f.attempts === 0 ? 0 : f.errorAttempts / f.attempts;
}

/**
 * Compute selection weight for a fact.
 *
 * Higher weight = more likely to be picked next. The weight blends:
 *   - urgency from box level (low box = high urgency)
 *   - urgency from slow average response time
 *   - urgency from error history
 *   - a recency damper so the same fact is not picked twice in a row
 *
 * New facts (attempts === 0) get a fixed high weight so they get introduced
 * early but not all at once (the random draw spreads them out).
 */
export function factWeight(f: FactStat, now: number): number {
  // Recency: facts seen in the last few seconds are heavily damped.
  const sinceLastSec = f.lastSeen === 0 ? Infinity : (now - f.lastSeen) / 1000;
  const recencyDamper = Math.min(sinceLastSec / 10, 1); // <10s = scaled down

  if (f.attempts === 0) {
    // New: high weight, but still subject to recency damper.
    return 8 * recencyDamper;
  }

  const boxFactor = (MAX_BOX - f.box) / MAX_BOX; // box 0 → 1, box 5 → 0
  const timePenalty = Math.min(avgTimeMs(f) / 1000, 5); // cap at 5s
  const errorPenalty = errorRate(f) * 4;

  const raw = 1 + boxFactor * 4 + timePenalty + errorPenalty;
  return Math.max(0.05, raw * recencyDamper);
}

/**
 * Pick the next fact via weighted random sampling.
 * The `random` parameter exists so tests can supply a deterministic generator.
 */
export function selectNextFact(
  facts: FactStat[],
  now: number,
  random: () => number = Math.random
): FactStat {
  if (facts.length === 0) {
    throw new Error('selectNextFact: empty facts array');
  }

  const weights = facts.map((f) => factWeight(f, now));
  const total = weights.reduce((s, w) => s + w, 0);

  if (total <= 0) {
    // Degenerate: just return a uniform pick.
    return facts[Math.floor(random() * facts.length)];
  }

  let r = random() * total;
  for (let i = 0; i < facts.length; i++) {
    r -= weights[i];
    if (r <= 0) return facts[i];
  }
  return facts[facts.length - 1];
}

/**
 * Record a completed attempt and update box state.
 *
 * Promotion rule: correct + fast (< FLUENCY_MS) → box up.
 * Demotion rule: any wrong keystroke during the attempt → box down.
 * Slow but correct: box unchanged.
 */
export function recordAttempt(
  f: FactStat,
  responseTimeMs: number,
  errorKeystrokes: number,
  now: number
): void {
  f.attempts++;
  f.totalTimeMs += responseTimeMs;
  f.lastTimeMs = responseTimeMs;
  f.bestTimeMs =
    f.bestTimeMs === 0 ? responseTimeMs : Math.min(f.bestTimeMs, responseTimeMs);
  f.lastSeen = now;
  f.errorKeystrokes += errorKeystrokes;

  if (errorKeystrokes > 0) {
    f.errorAttempts++;
    f.box = Math.max(0, f.box - 1);
  } else if (responseTimeMs < FLUENCY_MS) {
    f.box = Math.min(MAX_BOX, f.box + 1);
  }
}

const STORAGE_KEY = 'gangertabellen-stats-v1';

export interface PersistedState {
  version: 1;
  facts: FactStat[];
  sessionsCompleted: number;
}

/** Load persisted stats from localStorage, or build a fresh state. */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.facts)) {
      return freshState();
    }
    // Ensure the saved set covers the full 55 facts (in case the schema grows).
    const all = makeAllFacts();
    for (const f of parsed.facts) {
      const slot = all.find((x) => x.a === f.a && x.b === f.b);
      if (slot) Object.assign(slot, f);
    }
    return {
      version: 1,
      facts: all,
      sessionsCompleted: parsed.sessionsCompleted ?? 0,
    };
  } catch {
    return freshState();
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode, quota). Silent failure is
    // acceptable — the user keeps playing, just without persistence.
  }
}

export function freshState(): PersistedState {
  return { version: 1, facts: makeAllFacts(), sessionsCompleted: 0 };
}

export function masteredCount(facts: FactStat[]): number {
  return facts.filter(isMastered).length;
}
