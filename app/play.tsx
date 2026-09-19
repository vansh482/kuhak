import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  BackHandler,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { color, radius, space, font, fontSize } from '../src/theme/tokens';
import { t } from '../src/i18n';
import { useGameStore } from '../src/store';
import { clueOrder, resolveVote } from '../src/game/logic';
import type { GamePhase, Player, PlayerId } from '../src/game/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_H * 0.45;

// ─── Main Play Screen ───────────────────────────────────────────────────────

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const currentRound = useGameStore((s) => s.currentRound);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const addRoundScores = useGameStore((s) => s.addRoundScores);
  const setLastOutcome = useGameStore((s) => s.setLastOutcome);
  const recordRoundStats = useGameStore((s) => s.recordRoundStats);

  const [phase, setPhase] = useState<GamePhase>('deal');
  const [votedOutId, setVotedOutId] = useState<PlayerId | null>(null);

  // Discuss timer state — lifted here so "back to discussion" resumes
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  // ── Back handler ────────────────────────────────────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(t('play.quitRound'), '', [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('play.quitConfirm'),
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ]);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  // Guard: no round data
  if (!currentRound) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.bodyText}>No round in progress.</Text>
      </View>
    );
  }

  const { config, imposterIds, secret, imposterHintText, startSeat } = currentRound;
  const players = config.players;
  const orderedPlayers = clueOrder(players, startSeat);

  // Initialize timer on first render
  if (timerRemaining === null) {
    // Will be set when discuss phase starts
  }

  const resolveAndNavigate = (
    votedId: PlayerId,
    guessCorrect: boolean | null,
  ) => {
    const outcome = resolveVote(votedId, imposterIds, guessCorrect);

    if (outcome.crewWon) {
      const crewPoints: Record<PlayerId, number> = {};
      for (const p of players) {
        if (!imposterIds.includes(p.id)) {
          crewPoints[p.id] = 2;
        }
      }
      const mergedPoints = { ...outcome.points, ...crewPoints };
      const mergedOutcome = { ...outcome, points: mergedPoints };
      addRoundScores(mergedOutcome);
      setLastOutcome(mergedOutcome);
      recordRoundStats(players, imposterIds, mergedOutcome);
    } else {
      addRoundScores(outcome);
      setLastOutcome(outcome);
      recordRoundStats(players, imposterIds, outcome);
    }

    router.replace('/result');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      {phase === 'deal' && (
        <DealPhase
          players={players}
          imposterIds={imposterIds}
          secret={secret}
          imposterHint={config.imposterHint}
          imposterHintText={imposterHintText}
          hapticsEnabled={hapticsEnabled}
          onComplete={() => {
            setTimerRemaining(config.timerSeconds);
            setPhase('discuss');
          }}
        />
      )}
      {phase === 'discuss' && (
        <DiscussPhase
          orderedPlayers={orderedPlayers}
          remaining={timerRemaining ?? config.timerSeconds}
          onTick={setTimerRemaining}
          hapticsEnabled={hapticsEnabled}
          onVote={() => setPhase('vote')}
        />
      )}
      {phase === 'vote' && (
        <VotePhase
          players={players}
          onBackToDiscussion={() => setPhase('discuss')}
          onVoteConfirm={(votedId) => {
            const wasCaught = imposterIds.includes(votedId);
            if (wasCaught) {
              setVotedOutId(votedId);
              setPhase('guess');
            } else {
              resolveAndNavigate(votedId, null);
            }
          }}
        />
      )}
      {phase === 'guess' && votedOutId && (
        <GuessPhase
          players={players}
          imposterIds={imposterIds}
          votedOutId={votedOutId}
          secret={secret}
          onResolve={(guessCorrect) => {
            resolveAndNavigate(votedOutId, guessCorrect);
          }}
        />
      )}
    </View>
  );
}

// ─── Deal Phase ─────────────────────────────────────────────────────────────

interface DealPhaseProps {
  players: Player[];
  imposterIds: PlayerId[];
  secret: { word: string; category: string };
  imposterHint: string;
  imposterHintText: string | null;
  hapticsEnabled: boolean;
  onComplete: () => void;
}

function DealPhase({
  players,
  imposterIds,
  secret,
  imposterHint,
  imposterHintText,
  hapticsEnabled,
  onComplete,
}: DealPhaseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hasSeenCard, setHasSeenCard] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flipProgress = useSharedValue(0);
  const holdProgress = useSharedValue(0);

  const player = players[currentIdx];
  const isImposter = imposterIds.includes(player?.id ?? '');

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flipProgress.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: flipProgress.value >= 0.5 ? 1 : 0,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${holdProgress.value * 100}%`,
  }));

  const handlePressIn = () => {
    holdProgress.value = withTiming(1, { duration: 400, easing: Easing.linear });
    holdTimerRef.current = setTimeout(() => {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      flipProgress.value = withTiming(1, { duration: 220 });
      setHasSeenCard(true);
    }, 400);
  };

  const handlePressOut = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdProgress.value = withTiming(0, { duration: 150 });
    flipProgress.value = withTiming(0, { duration: 180 });
  };

  const handleNext = () => {
    setHasSeenCard(false);
    const nextIdx = currentIdx + 1;
    if (nextIdx >= players.length) {
      onComplete();
    } else {
      setCurrentIdx(nextIdx);
    }
  };

  if (!player) return null;

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseCounter}>
        {t('play.cardOf', { current: currentIdx + 1, total: players.length })}
      </Text>

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardPressable}
      >
        {/* Front face -- glass hidden card */}
        <Animated.View style={[styles.card, styles.cardGlass, frontStyle]}>
          <Text style={styles.playerLabel}>
            Player {player.seat + 1}
          </Text>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.holdHint}>
            {t('play.holdToReveal')}
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressBarStyle]} />
          </View>
        </Animated.View>

        {/* Back face -- revealed content */}
        <Animated.View
          style={[
            styles.card,
            styles.cardAbsolute,
            isImposter ? styles.cardCoral : styles.cardAmber,
            backStyle,
          ]}
        >
          {isImposter ? (
            <View style={styles.cardContent}>
              <Text style={styles.imposterLabel}>
                {t('play.youreTheImposter')}
              </Text>
              {(imposterHint === 'category' || imposterHint === 'category_hint') && (
                <Text style={styles.hintText}>
                  {t('play.category', { name: secret.category })}
                </Text>
              )}
              {imposterHint === 'category_hint' && imposterHintText && (
                <Text style={styles.hintText}>
                  {imposterHintText}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.cardContent}>
              <Text style={styles.secretWord}>{secret.word}</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>

      {hasSeenCard && (
        <Pressable onPress={handleNext} style={styles.nextCardBtn}>
          <Text style={styles.nextCardBtnText}>
            {currentIdx + 1 < players.length ? 'Pass to next player' : 'Start discussion'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Discuss Phase ──────────────────────────────────────────────────────────

interface DiscussPhaseProps {
  orderedPlayers: Player[];
  remaining: number;
  onTick: (seconds: number) => void;
  hapticsEnabled: boolean;
  onVote: () => void;
}

function DiscussPhase({
  orderedPlayers,
  remaining,
  onTick,
  hapticsEnabled,
  onVote,
}: DiscussPhaseProps) {
  const [localRemaining, setLocalRemaining] = useState(remaining);
  const [paused, setPaused] = useState(false);
  const [currentClueIdx, setCurrentClueIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const noTimer = remaining === 0;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (noTimer) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (localRemaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      intervalRef.current = setInterval(() => {
        setLocalRemaining((prev) => {
          const next = prev - 1;
          onTick(next);
          if (next <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, noTimer, localRemaining > 0]);

  useEffect(() => {
    if (!noTimer && localRemaining === 0) {
      if (hapticsEnabled) {
        const fireHaptics = async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setTimeout(
            () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
            100,
          );
          setTimeout(
            () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
            200,
          );
        };
        fireHaptics();
      }
      setTimeout(onVote, 500);
    }
  }, [localRemaining]);

  const displaySeconds = noTimer ? elapsed : localRemaining;
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>{t('play.discussion')}</Text>

      <Text
        style={[
          styles.timer,
          !noTimer && localRemaining <= 10 && localRemaining > 0 && styles.timerUrgent,
        ]}
      >
        {timerText}
      </Text>

      <Text style={styles.startsText}>
        {t('play.starts', { name: orderedPlayers[0]?.name ?? '' })}
      </Text>

      {/* Clue order pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillStrip}
        contentContainerStyle={styles.pillStripContent}
      >
        {orderedPlayers.map((player, idx) => (
          <Pressable
            key={player.id}
            onPress={() => setCurrentClueIdx(idx)}
            style={[
              styles.pill,
              idx === currentClueIdx && styles.pillActive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                idx === currentClueIdx && styles.pillTextActive,
              ]}
            >
              {player.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={styles.discussControls}>
        <Pressable
          onPress={() => setPaused((p) => !p)}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>
            {paused ? t('play.resume') : t('play.pause')}
          </Text>
        </Pressable>
        <Pressable onPress={onVote} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>{t('play.goToVote')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Vote Phase ─────────────────────────────────────────────────────────────

interface VotePhaseProps {
  players: Player[];
  onBackToDiscussion: () => void;
  onVoteConfirm: (votedId: PlayerId) => void;
}

function VotePhase({
  players,
  onBackToDiscussion,
  onVoteConfirm,
}: VotePhaseProps) {
  const [selectedId, setSelectedId] = useState<PlayerId | null>(null);

  const confirmScale = useSharedValue(1);

  const confirmBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
  }));

  const handleConfirm = () => {
    if (!selectedId) return;
    confirmScale.value = withSpring(0.95, {}, () => {
      confirmScale.value = withSpring(1);
    });
    onVoteConfirm(selectedId);
  };

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>{t('play.whoIsOut')}</Text>
      <Text style={styles.subtitleText}>{t('play.tapToAccuse')}</Text>

      <View style={styles.voteGrid}>
        {players.map((player) => {
          const isSelected = selectedId === player.id;
          return (
            <Pressable
              key={player.id}
              onPress={() => setSelectedId(player.id)}
              style={[
                styles.voteCard,
                isSelected && styles.voteCardSelected,
              ]}
            >
              <Text
                style={[
                  styles.voteCardText,
                  isSelected && styles.voteCardTextSelected,
                ]}
              >
                {player.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={confirmBtnStyle}>
        <Pressable
          onPress={handleConfirm}
          disabled={!selectedId}
          style={[
            styles.coralBtn,
            !selectedId && styles.btnDisabled,
          ]}
        >
          <Text
            style={[
              styles.coralBtnText,
              !selectedId && styles.btnTextDisabled,
            ]}
          >
            {t('play.confirmVote')}
          </Text>
        </Pressable>
      </Animated.View>

      <Pressable onPress={onBackToDiscussion} style={styles.linkBtn}>
        <Text style={styles.linkBtnText}>{t('play.backToDiscussion')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Guess Phase ────────────────────────────────────────────────────────────

interface GuessPhaseProps {
  players: Player[];
  imposterIds: PlayerId[];
  votedOutId: PlayerId;
  secret: { word: string; category: string };
  onResolve: (guessCorrect: boolean) => void;
}

function GuessPhase({
  players,
  imposterIds,
  votedOutId,
  secret,
  onResolve,
}: GuessPhaseProps) {
  const imposter = players.find((p) => p.id === votedOutId);

  const cardScale = useSharedValue(0.95);

  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 14, stiffness: 160 });
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.caughtText}>
        {t('play.wasTheImposter', { name: imposter?.name ?? '' })}
      </Text>
      <Text style={styles.subtitleText}>{t('play.oneGuess')}</Text>

      <Animated.View style={[styles.guessCard, cardAnimStyle]}>
        <Text style={styles.guessCardLabel}>{t('play.theWordWas')}</Text>
        <Text style={styles.guessCardWord}>{secret.word}</Text>
      </Animated.View>

      <View style={styles.guessButtons}>
        <Pressable
          onPress={() => onResolve(true)}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>{t('play.theyGotIt')}</Text>
        </Pressable>
        <Pressable
          onPress={() => onResolve(false)}
          style={styles.coralBtn}
        >
          <Text style={styles.coralBtnText}>{t('play.wrong')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: space.lg,
  },
  bodyText: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
    textAlign: 'center',
    marginTop: space.xl,
  },
  phaseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Deal phase ──
  phaseCounter: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space.lg,
  },
  cardPressable: {
    width: SCREEN_W * 0.82,
    height: CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.lg,
  },
  cardAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardGlass: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  cardAmber: {
    backgroundColor: color.amber,
  },
  cardCoral: {
    backgroundColor: color.coral,
  },
  playerLabel: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space.xs,
  },
  playerName: {
    fontFamily: font.heading,
    fontSize: fontSize.h1,
    color: color.text,
    marginBottom: space.xl,
  },
  holdHint: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: color.surfaceElevated,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: color.amber,
    borderRadius: 2,
  },
  nextCardBtn: {
    marginTop: space.xl,
    paddingVertical: 14,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  nextCardBtnText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.text,
    textAlign: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  secretWord: {
    fontFamily: font.display,
    fontSize: fontSize.h1,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  imposterLabel: {
    fontFamily: font.display,
    fontSize: fontSize.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: space.sm,
  },
  hintText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  // ── Discuss phase ──
  phaseTitle: {
    fontFamily: font.heading,
    fontSize: fontSize.h1,
    color: color.text,
    marginBottom: space.md,
  },
  timer: {
    fontFamily: font.display,
    fontSize: 56,
    color: color.text,
    letterSpacing: 2,
    marginBottom: space.sm,
  },
  timerUrgent: {
    color: color.coral,
  },
  startsText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text2,
    marginBottom: space.lg,
  },
  pillStrip: {
    maxHeight: 44,
    marginBottom: space.xl,
  },
  pillStripContent: {
    gap: space.sm,
    paddingHorizontal: space.sm,
  },
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  pillActive: {
    backgroundColor: color.amberSoft,
    borderColor: color.amber,
  },
  pillText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text2,
  },
  pillTextActive: {
    color: color.amber,
  },
  discussControls: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },

  // ── Vote phase ──
  subtitleText: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
    marginBottom: space.lg,
  },
  voteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    justifyContent: 'center',
    marginBottom: space.xl,
    paddingHorizontal: space.sm,
  },
  voteCard: {
    width: (SCREEN_W - space.lg * 2 - space.md) / 2 - space.sm,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
  },
  voteCardSelected: {
    backgroundColor: color.coralGlow,
    borderColor: color.coral,
  },
  voteCardText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.text,
  },
  voteCardTextSelected: {
    color: color.coral,
  },

  // ── Guess phase ──
  caughtText: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.coral,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  guessCard: {
    width: SCREEN_W * 0.82,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    marginBottom: space.xl,
  },
  guessCardLabel: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space.sm,
  },
  guessCardWord: {
    fontFamily: font.display,
    fontSize: fontSize.h1,
    color: color.amber,
  },
  guessButtons: {
    flexDirection: 'row',
    gap: space.md,
  },

  // ── Shared buttons ──
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    backgroundColor: color.amber,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.bg,
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    minWidth: 120,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.text,
  },
  coralBtn: {
    paddingVertical: 14,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    backgroundColor: color.coral,
    minWidth: 140,
    alignItems: 'center',
  },
  coralBtnText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnTextDisabled: {
    opacity: 0.5,
  },
  linkBtn: {
    marginTop: space.lg,
    paddingVertical: space.sm,
  },
  linkBtnText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text2,
    textDecorationLine: 'underline',
  },
});
