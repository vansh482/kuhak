import type { Player, PlayerId, RNG, RoundOutcome, WordEntry } from './types';
import { getAllEntries, ALL_PACK_IDS } from '../content';

/**
 * Fisher-Yates shuffle (in-place) using the injected RNG.
 * Returns the same array reference, now shuffled.
 */
function shuffle<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Assigns `imposterCount` imposters from the player list.
 * Returns the IDs of the chosen imposters.
 */
export function dealRoles(
  players: Player[],
  imposterCount: number,
  rng: RNG,
): PlayerId[] {
  const ids = players.map((p) => p.id);
  shuffle(ids, rng);
  return ids.slice(0, imposterCount);
}

/**
 * Maximum imposters allowed for a given player count.
 * floor((n-1)/3), minimum 1. Never allows imposters >= half the table.
 */
export function maxImposters(playerCount: number): number {
  if (playerCount < 3) return 0;
  return Math.max(1, Math.floor((playerCount - 1) / 3));
}

/**
 * Picks a random word + category from the specified content packs.
 * If packIds includes '__mixed__', samples across every available pack.
 */
export function pickSecret(
  packIds: string[],
  rng: RNG,
): { word: string; category: string } {
  const resolvedPacks = packIds.includes('__mixed__') ? ALL_PACK_IDS : packIds;
  const entries: WordEntry[] = getAllEntries(resolvedPacks);

  if (entries.length === 0) {
    throw new Error('No entries found for the selected packs');
  }

  const idx = Math.floor(rng() * entries.length);
  const entry = entries[idx];
  return { word: entry.word, category: entry.category };
}

/**
 * Returns every player exactly once in clue-giving order,
 * starting from the player at `startSeat` and wrapping around.
 */
export function clueOrder(players: Player[], startSeat: number): Player[] {
  const sorted = [...players].sort((a, b) => a.seat - b.seat);
  const startIdx = sorted.findIndex((p) => p.seat === startSeat);

  if (startIdx === -1) {
    throw new Error(`No player found at seat ${startSeat}`);
  }

  return [...sorted.slice(startIdx), ...sorted.slice(0, startIdx)];
}

/**
 * Resolves a vote round into an outcome.
 *
 * Four branches:
 * 1. Innocent voted out -> crew loses
 * 2. Imposter caught + correct guess -> imposter steals win
 * 3. Imposter caught + wrong guess -> crew wins
 * 4. Imposter caught + null guess (multi-imposter partial) -> crew wins partial
 */
export function resolveVote(
  votedOut: PlayerId,
  imposterIds: PlayerId[],
  guessCorrect: boolean | null,
): RoundOutcome {
  const wasCaught = imposterIds.includes(votedOut);

  if (!wasCaught) {
    // Branch 1: Innocent voted out — crew loses
    const points: Record<PlayerId, number> = {};
    for (const id of imposterIds) {
      points[id] = 3;
    }
    return {
      crewWon: false,
      points,
      headline: 'Imposter walked free',
      detail: 'An innocent player was voted out. The imposter wins!',
      wasCaught: false,
    };
  }

  if (guessCorrect === true) {
    // Branch 2: Imposter caught but guessed the word — imposter steals
    const points: Record<PlayerId, number> = {};
    points[votedOut] = 3;
    return {
      crewWon: false,
      points,
      headline: 'Imposter stole the win',
      detail: 'The imposter was caught but correctly guessed the secret word!',
      wasCaught: true,
    };
  }

  if (guessCorrect === false) {
    // Branch 3: Imposter caught + wrong guess — crew wins
    const points: Record<PlayerId, number> = {};
    // All non-imposter participants would get points,
    // but we only know imposter IDs here — caller distributes crew points.
    // We mark imposter as 0 and return +2 for "crew" as a sentinel.
    for (const id of imposterIds) {
      points[id] = 0;
    }
    return {
      crewWon: true,
      points,
      headline: 'Crew wins!',
      detail: 'The imposter was caught and failed to guess the secret word.',
      wasCaught: true,
    };
  }

  // Branch 4: guessCorrect === null — multi-imposter partial, no guess phase
  const points: Record<PlayerId, number> = {};
  for (const id of imposterIds) {
    points[id] = 0;
  }
  return {
    crewWon: true,
    points,
    headline: 'Crew wins!',
    detail: 'An imposter was caught. The hunt continues.',
    wasCaught: true,
  };
}
