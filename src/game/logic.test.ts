import type { Player, RNG, WordEntry } from './types';
import { dealRoles, maxImposters, pickSecret, clueOrder, resolveVote } from './logic';

// ---------------------------------------------------------------------------
// Mock the content module (not yet built by another agent)
// ---------------------------------------------------------------------------
jest.mock('../content', () => {
  const entries: Record<string, Array<{ word: string; category: string }>> = {
    animals: [
      { word: 'Tiger', category: 'Animals' },
      { word: 'Elephant', category: 'Animals' },
      { word: 'Peacock', category: 'Animals' },
    ],
    food: [
      { word: 'Biryani', category: 'Food' },
      { word: 'Dosa', category: 'Food' },
    ],
    sports: [
      { word: 'Cricket', category: 'Sports' },
    ],
  };
  return {
    getAllEntries: (packIds: string[]) =>
      packIds.flatMap((id) => entries[id] ?? []),
    ALL_PACK_IDS: Object.keys(entries),
  };
});

// ---------------------------------------------------------------------------
// Seeded RNG — simple mulberry32 for deterministic tests
// ---------------------------------------------------------------------------
function mulberry32(seed: number): RNG {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    seat: i,
  }));
}

// ===========================================================================
// dealRoles
// ===========================================================================
describe('dealRoles', () => {
  it('assigns exactly imposterCount imposters', () => {
    const players = makePlayers(6);
    const rng = mulberry32(42);
    const imposters = dealRoles(players, 2, rng);
    expect(imposters).toHaveLength(2);
  });

  it('returns valid player IDs', () => {
    const players = makePlayers(6);
    const rng = mulberry32(99);
    const imposters = dealRoles(players, 1, rng);
    const validIds = new Set(players.map((p) => p.id));
    for (const id of imposters) {
      expect(validIds.has(id)).toBe(true);
    }
  });

  it('never returns duplicate IDs', () => {
    const players = makePlayers(8);
    const rng = mulberry32(7);
    const imposters = dealRoles(players, 3, rng);
    expect(new Set(imposters).size).toBe(3);
  });

  it('distributes uniformly across 10,000 seeded runs', () => {
    const players = makePlayers(5);
    const counts: Record<string, number> = {};
    for (const p of players) counts[p.id] = 0;

    const RUNS = 10_000;
    for (let i = 0; i < RUNS; i++) {
      const rng = mulberry32(i);
      const [imposterId] = dealRoles(players, 1, rng);
      counts[imposterId]++;
    }

    // Expected: each player ~2000 times. Allow max 15% deviation.
    const expected = RUNS / players.length;
    const maxDeviation = expected * 0.15;
    for (const id of Object.keys(counts)) {
      expect(counts[id]).toBeGreaterThan(expected - maxDeviation);
      expect(counts[id]).toBeLessThan(expected + maxDeviation);
    }
  });
});

// ===========================================================================
// maxImposters
// ===========================================================================
describe('maxImposters', () => {
  it('returns 1 for 3 players', () => {
    expect(maxImposters(3)).toBe(1);
  });

  it('returns 1 for 4 players', () => {
    expect(maxImposters(4)).toBe(1);
  });

  it('returns 1 for 5 players', () => {
    expect(maxImposters(5)).toBe(1);
  });

  it('returns 2 for 7 players', () => {
    expect(maxImposters(7)).toBe(2);
  });

  it('never allows imposters >= half the table', () => {
    for (let n = 3; n <= 30; n++) {
      const max = maxImposters(n);
      expect(max).toBeLessThan(n / 2);
    }
  });

  it('returns 0 for fewer than 3 players', () => {
    expect(maxImposters(2)).toBe(0);
    expect(maxImposters(1)).toBe(0);
  });
});

// ===========================================================================
// pickSecret
// ===========================================================================
describe('pickSecret', () => {
  it('never returns empty word or category', () => {
    for (let i = 0; i < 100; i++) {
      const secret = pickSecret(['animals', 'food'], [], mulberry32(i));
      expect(secret.word.length).toBeGreaterThan(0);
      expect(secret.category.length).toBeGreaterThan(0);
    }
  });

  it('returns entries from the specified pack', () => {
    const rng = mulberry32(42);
    const secret = pickSecret(['sports'], [], rng);
    expect(secret.word).toBe('Cricket');
    expect(secret.category).toBe('Sports');
  });

  it('__mixed__ can reach every pack', () => {
    const seenCategories = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const rng = mulberry32(i);
      const secret = pickSecret(['__mixed__'], [], rng);
      seenCategories.add(secret.category);
    }
    expect(seenCategories.has('Animals')).toBe(true);
    expect(seenCategories.has('Food')).toBe(true);
    expect(seenCategories.has('Sports')).toBe(true);
  });

  it('throws when no entries match', () => {
    const rng = mulberry32(1);
    expect(() => pickSecret(['nonexistent'], [], rng)).toThrow('No entries found');
  });

  it('excludes used words', () => {
    const used = ['tiger', 'elephant'];
    const secret = pickSecret(['animals'], used, mulberry32(1));
    expect(secret.word).toBe('Peacock');
  });

  it('resets bag when all words used', () => {
    const used = ['tiger', 'elephant', 'peacock'];
    const secret = pickSecret(['animals'], used, mulberry32(1));
    expect(secret.bagExhausted).toBe(true);
    expect(['Tiger', 'Elephant', 'Peacock']).toContain(secret.word);
  });

  it('never repeats across sequential picks', () => {
    const used: string[] = [];
    const words: string[] = [];
    for (let i = 0; i < 5; i++) {
      const secret = pickSecret(['animals', 'food'], used, mulberry32(i));
      if (secret.bagExhausted) break;
      expect(words).not.toContain(secret.word);
      words.push(secret.word);
      used.push(secret.word.toLowerCase());
    }
    expect(new Set(words).size).toBe(words.length);
  });
});

// ===========================================================================
// clueOrder
// ===========================================================================
describe('clueOrder', () => {
  it('returns every player exactly once', () => {
    const players = makePlayers(5);
    const order = clueOrder(players, 2);
    expect(order).toHaveLength(5);
    const ids = order.map((p) => p.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('starts from startSeat', () => {
    const players = makePlayers(5);
    const order = clueOrder(players, 3);
    expect(order[0].seat).toBe(3);
  });

  it('wraps around correctly', () => {
    const players = makePlayers(4);
    const order = clueOrder(players, 2);
    const seats = order.map((p) => p.seat);
    expect(seats).toEqual([2, 3, 0, 1]);
  });

  it('works when startSeat is 0', () => {
    const players = makePlayers(3);
    const order = clueOrder(players, 0);
    const seats = order.map((p) => p.seat);
    expect(seats).toEqual([0, 1, 2]);
  });

  it('throws when startSeat not found', () => {
    const players = makePlayers(3);
    expect(() => clueOrder(players, 99)).toThrow('No player found at seat 99');
  });

  it('handles unordered player input', () => {
    const players: Player[] = [
      { id: 'a', name: 'A', seat: 3 },
      { id: 'b', name: 'B', seat: 1 },
      { id: 'c', name: 'C', seat: 0 },
      { id: 'd', name: 'D', seat: 2 },
    ];
    const order = clueOrder(players, 2);
    const seats = order.map((p) => p.seat);
    expect(seats).toEqual([2, 3, 0, 1]);
  });
});

// ===========================================================================
// resolveVote
// ===========================================================================
describe('resolveVote', () => {
  const imposterIds = ['p1'];

  it('branch 1: innocent voted out — crew loses', () => {
    const result = resolveVote('p0', imposterIds, null);
    expect(result.crewWon).toBe(false);
    expect(result.wasCaught).toBe(false);
    expect(result.headline).toBe('Imposter walked free');
    expect(result.points['p1']).toBe(3);
  });

  it('branch 2: imposter caught + correct guess — imposter steals', () => {
    const result = resolveVote('p1', imposterIds, true);
    expect(result.crewWon).toBe(false);
    expect(result.wasCaught).toBe(true);
    expect(result.headline).toBe('Imposter stole the win');
    expect(result.points['p1']).toBe(3);
  });

  it('branch 3: imposter caught + wrong guess — crew wins', () => {
    const result = resolveVote('p1', imposterIds, false);
    expect(result.crewWon).toBe(true);
    expect(result.wasCaught).toBe(true);
    expect(result.headline).toBe('Crew wins!');
    expect(result.points['p1']).toBe(0);
  });

  it('branch 4: imposter caught + null guess — crew wins partial', () => {
    const result = resolveVote('p1', imposterIds, null);
    expect(result.crewWon).toBe(true);
    expect(result.wasCaught).toBe(true);
    expect(result.headline).toBe('Crew wins!');
    expect(result.detail).toContain('hunt continues');
    expect(result.points['p1']).toBe(0);
  });

  it('works with multiple imposters', () => {
    const multiImposters = ['p1', 'p2'];

    // Innocent voted out — all imposters get points
    const result = resolveVote('p0', multiImposters, null);
    expect(result.crewWon).toBe(false);
    expect(result.points['p1']).toBe(3);
    expect(result.points['p2']).toBe(3);
  });
});
