import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { color, radius, space, font, fontSize } from '../src/theme/tokens';
import { t } from '../src/i18n';
import { useGameStore } from '../src/store';
import CatchSlam from '../src/components/CatchSlam';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const currentRound = useGameStore((s) => s.currentRound);
  const scores = useGameStore((s) => s.scores);
  const lastOutcome = useGameStore((s) => s.lastOutcome);
  const setCurrentRound = useGameStore((s) => s.setCurrentRound);
  const setLastOutcome = useGameStore((s) => s.setLastOutcome);

  const [showSlam, setShowSlam] = useState(false);
  const [slamDismissed, setSlamDismissed] = useState(false);

  useEffect(() => {
    if (lastOutcome?.wasCaught && !slamDismissed) {
      setShowSlam(true);
    }
  }, [lastOutcome, slamDismissed]);

  const handleSlamDismiss = () => {
    setShowSlam(false);
    setSlamDismissed(true);
  };

  const handleNextRound = () => {
    setLastOutcome(null);
    useGameStore.getState().dealNewRound();
    router.replace('/play');
  };

  const handleBackToHome = () => {
    setLastOutcome(null);
    setCurrentRound(null);
    router.replace('/');
  };

  if (!currentRound || !lastOutcome) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.bodyText}>No result to show.</Text>
      </View>
    );
  }

  const { config, imposterIds, secret } = currentRound;
  const players = config.players;
  const outcome = lastOutcome;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Catch Slam overlay */}
      {showSlam && (
        <View style={styles.slamOverlay}>
          <View style={styles.slamGradient}>
            <CatchSlam onDismiss={handleSlamDismiss} />
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Outcome badge */}
        <Animated.View
          entering={FadeIn.delay(slamDismissed ? 0 : 200).duration(400)}
          style={[
            styles.badge,
            outcome.crewWon ? styles.badgeGreen : styles.badgeCoral,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              outcome.crewWon ? styles.badgeTextGreen : styles.badgeTextCoral,
            ]}
          >
            {outcome.crewWon ? t('result.crewWins') : t('result.imposterWins')}
          </Text>
        </Animated.View>

        {/* Headline */}
        <Animated.Text
          entering={FadeIn.delay(slamDismissed ? 100 : 350).duration(400)}
          style={styles.headline}
        >
          {outcome.headline}
        </Animated.Text>

        {/* Detail */}
        <Animated.Text
          entering={FadeIn.delay(slamDismissed ? 150 : 450).duration(400)}
          style={styles.detail}
        >
          {outcome.detail}
        </Animated.Text>

        {/* Word reveal */}
        <Animated.View
          entering={FadeIn.delay(slamDismissed ? 200 : 550).duration(400)}
          style={styles.wordCard}
        >
          <Text style={styles.wordLabel}>{t('play.theWordWas')}</Text>
          <Text style={styles.wordValue}>{secret.word}</Text>
        </Animated.View>

        {/* Scores section */}
        <Animated.View
          entering={FadeIn.delay(slamDismissed ? 300 : 650).duration(400)}
          style={styles.scoresSection}
        >
          <Text style={styles.scoresTitle}>{t('result.scores')}</Text>

          {players.map((player) => {
            const roundPts = outcome.points[player.id] ?? 0;
            const totalPts = scores[player.id] ?? 0;
            const isImposter = imposterIds.includes(player.id);

            return (
              <View key={player.id} style={styles.scoreRow}>
                <View style={styles.scoreNameCol}>
                  <Text style={styles.scoreName}>{player.name}</Text>
                  {isImposter && (
                    <View style={styles.imposterTag}>
                      <Text style={styles.imposterTagText}>Imposter</Text>
                    </View>
                  )}
                </View>
                <View style={styles.scorePointsCol}>
                  <Text
                    style={[
                      styles.scoreRound,
                      roundPts > 0 && styles.scorePositive,
                    ]}
                  >
                    {roundPts > 0 ? `+${roundPts}` : '0'}
                  </Text>
                  <Text style={styles.scoreTotal}>{totalPts}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Action buttons */}
        <Animated.View
          entering={FadeIn.delay(slamDismissed ? 400 : 750).duration(400)}
          style={styles.actions}
        >
          <Pressable onPress={handleNextRound} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t('result.nextRound')}</Text>
          </Pressable>
          <Pressable onPress={handleBackToHome} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>{t('result.backToHome')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingBottom: 60,
    alignItems: 'center',
  },
  bodyText: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
    textAlign: 'center',
    marginTop: space.xl,
  },

  // ── Slam overlay ──
  slamOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
  slamGradient: {
    flex: 1,
    backgroundColor: '#FF6B6B',
  },

  // ── Badge ──
  badge: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    marginTop: space.xl,
    marginBottom: space.md,
  },
  badgeGreen: {
    backgroundColor: color.greenSoft,
    borderWidth: 1,
    borderColor: color.green,
  },
  badgeCoral: {
    backgroundColor: color.coralGlow,
    borderWidth: 1,
    borderColor: color.coral,
  },
  badgeText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
  },
  badgeTextGreen: {
    color: color.green,
  },
  badgeTextCoral: {
    color: color.coral,
  },

  // ── Content ──
  headline: {
    fontFamily: font.heading,
    fontSize: fontSize.h1,
    color: color.text,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  detail: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
    textAlign: 'center',
    marginBottom: space.lg,
  },

  // ── Word card ──
  wordCard: {
    width: SCREEN_W * 0.82,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    marginBottom: space.xl,
  },
  wordLabel: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space.xs,
  },
  wordValue: {
    fontFamily: font.display,
    fontSize: fontSize.h1,
    color: color.amber,
  },

  // ── Scores ──
  scoresSection: {
    width: '100%',
    marginBottom: space.xl,
  },
  scoresTitle: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text,
    marginBottom: space.md,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  scoreNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flex: 1,
  },
  scoreName: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text,
  },
  imposterTag: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: color.coralGlow,
  },
  imposterTagText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.xs,
    color: color.coral,
  },
  scorePointsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  scoreRound: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text3,
    minWidth: 30,
    textAlign: 'right',
  },
  scorePositive: {
    color: color.green,
  },
  scoreTotal: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text,
    minWidth: 36,
    textAlign: 'right',
  },

  // ── Buttons ──
  actions: {
    alignItems: 'center',
    gap: space.md,
    width: '100%',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: color.amber,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.bg,
  },
  linkBtn: {
    paddingVertical: space.sm,
  },
  linkBtnText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text2,
    textDecorationLine: 'underline',
  },
});
