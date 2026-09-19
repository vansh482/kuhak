export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  seat: number;
}

export type RNG = () => number;

export type ImposterHint = 'none' | 'category' | 'category_hint';

export interface RoundConfig {
  players: Player[];
  imposterCount: number;
  packIds: string[];
  timerSeconds: number;
  imposterHint: ImposterHint;
}

export interface DealtRound {
  config: RoundConfig;
  imposterIds: PlayerId[];
  secret: { word: string; category: string };
  decoyWords: string[] | null;
  startSeat: number;
}

export interface RoundOutcome {
  crewWon: boolean;
  points: Record<PlayerId, number>;
  headline: string;
  detail: string;
  wasCaught: boolean;
}

export type GamePhase = 'deal' | 'discuss' | 'vote' | 'guess';

export interface PlayerStats {
  roundsPlayed: number;
  timesImposter: number;
  timesCaught: number;
  timesWalkedFree: number;
  totalScore: number;
}

export interface SavedGroup {
  id: string;
  name: string;
  playerNames: string[];
  createdAt: number;
}

export interface WordPack {
  id: string;
  name: string;
  entries: WordEntry[];
}

export interface WordEntry {
  word: string;
  category: string;
}
