import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Player, DealtRound, RoundOutcome, ImposterHint, SavedGroup, PlayerStats } from '../game/types';
import { dealRoles, pickSecret, pickHint, makeRng } from '../game/logic';
import { getAllEntries, ALL_PACK_IDS } from '../content';

interface GameStore {
  roster: Player[];
  setRoster: (roster: Player[]) => void;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  renamePlayer: (id: string, name: string) => void;

  selectedPacks: string[];
  setSelectedPacks: (packs: string[]) => void;

  imposterCount: number;
  setImposterCount: (count: number) => void;

  timerSeconds: number;
  setTimerSeconds: (seconds: number) => void;

  imposterHint: ImposterHint;
  setImposterHint: (hint: ImposterHint) => void;

  currentRound: DealtRound | null;
  setCurrentRound: (round: DealtRound | null) => void;

  /** Transient — the last resolved round outcome, for the result screen. */
  lastOutcome: RoundOutcome | null;
  setLastOutcome: (outcome: RoundOutcome | null) => void;

  scores: Record<string, number>;
  addRoundScores: (outcome: RoundOutcome) => void;
  resetScores: () => void;

  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;

  activeGroupId: string | null;
  clearRoster: () => void;
  savedGroups: SavedGroup[];
  saveCurrentGroup: (name: string) => void;
  updateGroup: (id: string) => void;
  deleteGroup: (id: string) => void;
  loadGroup: (group: SavedGroup) => void;

  usedWords: string[];
  markWordUsed: (word: string) => void;
  resetUsedWords: () => void;

  /** Creates a new round from current settings and stores it in currentRound. */
  dealNewRound: () => DealtRound;

  playerStats: Record<string, PlayerStats>;
  recordRoundStats: (players: Player[], imposterIds: string[], outcome: RoundOutcome) => void;

  resetAll: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      roster: [],
      setRoster: (roster) => set({ roster }),
      addPlayer: (name) => {
        const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const { roster } = get();
        set({
          roster: [...roster, { id, name, seat: roster.length }],
        });
      },
      removePlayer: (id) =>
        set((s) => ({
          roster: s.roster
            .filter((p) => p.id !== id)
            .map((p, i) => ({ ...p, seat: i })),
        })),
      renamePlayer: (id, name) =>
        set((s) => ({
          roster: s.roster.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      selectedPacks: ['bollywood', 'food', 'cricket'],
      setSelectedPacks: (packs) => set({ selectedPacks: packs }),

      imposterCount: 1,
      setImposterCount: (count) => set({ imposterCount: count }),

      timerSeconds: 120,
      setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),

      imposterHint: 'category',
      setImposterHint: (hint) => set({ imposterHint: hint }),

      currentRound: null,
      setCurrentRound: (round) => set({ currentRound: round }),

      lastOutcome: null,
      setLastOutcome: (outcome) => set({ lastOutcome: outcome }),

      scores: {},
      addRoundScores: (outcome) =>
        set((s) => {
          const next = { ...s.scores };
          for (const [id, pts] of Object.entries(outcome.points)) {
            next[id] = (next[id] || 0) + pts;
          }
          return { scores: next };
        }),
      resetScores: () => set({ scores: {} }),

      soundEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      hapticsEnabled: true,
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

      activeGroupId: null,
      clearRoster: () => set({ roster: [], activeGroupId: null }),
      savedGroups: [],
      saveCurrentGroup: (name) =>
        set((s) => {
          const group: SavedGroup = {
            id: `grp_${Date.now()}`,
            name,
            playerNames: s.roster.map((p) => p.name),
            createdAt: Date.now(),
          };
          return { savedGroups: [...s.savedGroups, group], activeGroupId: group.id };
        }),
      updateGroup: (id) =>
        set((s) => ({
          savedGroups: s.savedGroups.map((g) =>
            g.id === id ? { ...g, playerNames: s.roster.map((p) => p.name) } : g,
          ),
        })),
      deleteGroup: (id) =>
        set((s) => ({
          savedGroups: s.savedGroups.filter((g) => g.id !== id),
          activeGroupId: s.activeGroupId === id ? null : s.activeGroupId,
        })),
      loadGroup: (group) =>
        set({
          roster: group.playerNames.map((name, i) => ({
            id: `p_${Date.now()}_${i}`,
            name,
            seat: i,
          })),
          activeGroupId: group.id,
          scores: {},
        }),

      usedWords: [],
      markWordUsed: (word) =>
        set((s) => ({ usedWords: [...s.usedWords, word.toLowerCase()] })),
      resetUsedWords: () => set({ usedWords: [] }),

      dealNewRound: () => {
        const s = get();
        const rng = makeRng();
        const imposterIds = dealRoles(s.roster, s.imposterCount, rng);
        const { word, category, bagExhausted } = pickSecret(s.selectedPacks, s.usedWords, rng);
        if (bagExhausted) set({ usedWords: [] });
        set((prev) => ({ usedWords: [...prev.usedWords, word.toLowerCase()] }));

        const startSeat = Math.floor(rng() * s.roster.length);
        const resolvedPacks = s.selectedPacks.includes('__mixed__') ? ALL_PACK_IDS : s.selectedPacks;
        const pool = getAllEntries(resolvedPacks);
        const entry = pool.find((e) => e.word === word);
        const hint =
          (s.imposterHint === 'category_hint' || s.imposterHint === 'hint_only') && entry
            ? pickHint(entry, rng)
            : null;

        const round: DealtRound = {
          config: {
            players: s.roster,
            imposterCount: s.imposterCount,
            packIds: s.selectedPacks,
            timerSeconds: s.timerSeconds,
            imposterHint: s.imposterHint,
          },
          imposterIds,
          secret: { word, category },
          imposterHint: hint,
          startSeat,
        };

        set({ currentRound: round });
        return round;
      },

      playerStats: {},
      recordRoundStats: (players, imposterIds, outcome) =>
        set((s) => {
          const next = { ...s.playerStats };
          for (const p of players) {
            const key = p.id;
            const prev = next[key] || { roundsPlayed: 0, timesImposter: 0, timesCaught: 0, timesWalkedFree: 0, totalScore: 0 };
            const wasImposter = imposterIds.includes(p.id);
            next[key] = {
              roundsPlayed: prev.roundsPlayed + 1,
              timesImposter: prev.timesImposter + (wasImposter ? 1 : 0),
              timesCaught: prev.timesCaught + (wasImposter && outcome.wasCaught ? 1 : 0),
              timesWalkedFree: prev.timesWalkedFree + (wasImposter && !outcome.wasCaught ? 1 : 0),
              totalScore: prev.totalScore + (outcome.points[p.id] || 0),
            };
          }
          return { playerStats: next };
        }),

      resetAll: () =>
        set({
          roster: [],
          selectedPacks: ['bollywood', 'food', 'cricket'],
          imposterCount: 1,
          timerSeconds: 120,
          imposterHint: 'category',
          currentRound: null,
          lastOutcome: null,
          scores: {},
          soundEnabled: true,
          hapticsEnabled: true,
          activeGroupId: null,
          savedGroups: [],
          usedWords: [],
          playerStats: {},
        }),
    }),
    {
      name: 'kuhak-game-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        roster: state.roster,
        selectedPacks: state.selectedPacks,
        imposterCount: state.imposterCount,
        timerSeconds: state.timerSeconds,
        imposterHint: state.imposterHint,
        scores: state.scores,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
        savedGroups: state.savedGroups,
        activeGroupId: state.activeGroupId,
        usedWords: state.usedWords,
        playerStats: state.playerStats,
      }),
    }
  )
);
