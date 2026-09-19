import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { color, font, fontSize, radius, space } from '../src/theme/tokens';
import { t } from '../src/i18n';
import { useGameStore } from '../src/store';

function NavBar() {
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  return (
    <View style={styles.nav}>
      <Animated.View style={backAnimStyle}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          onPressIn={() => {
            backScale.value = withSpring(0.97, { damping: 15 });
          }}
          onPressOut={() => {
            backScale.value = withSpring(1, { damping: 15 });
          }}
          style={styles.navBackBtn}
          hitSlop={12}
        >
          <Text style={styles.navBackText}>{'←'}</Text>
        </Pressable>
      </Animated.View>
      <Text style={styles.navTitle}>{t('stats.title')}</Text>
      <View style={styles.navSpacer} />
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const playerStats = useGameStore((s) => s.playerStats);

  const entries = Object.entries(playerStats).sort(
    (a, b) => b[1].roundsPlayed - a[1].roundsPlayed,
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <NavBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 && (
          <Text style={styles.emptyText}>{t('stats.noStats')}</Text>
        )}

        {entries.map(([name, stats]) => {
          const winRate =
            stats.timesImposter > 0
              ? Math.round(
                  ((stats.timesImposter - stats.timesCaught) /
                    stats.timesImposter) *
                    100,
                )
              : 0;

          return (
            <View key={name} style={styles.playerCard}>
              <Text style={styles.playerName}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Text>

              <View style={styles.statsGrid}>
                <StatRow
                  label={t('stats.roundsPlayed')}
                  value={stats.roundsPlayed}
                />
                <StatRow
                  label={t('stats.timesImposter')}
                  value={stats.timesImposter}
                />
                <StatRow
                  label={t('stats.timesCaught')}
                  value={stats.timesCaught}
                />
                <StatRow
                  label={t('stats.walkedFree')}
                  value={stats.timesWalkedFree}
                />
                <StatRow
                  label={t('stats.escapeRate')}
                  value={stats.timesImposter > 0 ? `${winRate}%` : '—'}
                />
                <StatRow
                  label={t('stats.totalScore')}
                  value={stats.totalScore}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    height: 48,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackText: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text,
  },
  navSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.md,
    paddingBottom: space.xl,
  },
  emptyText: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text3,
    textAlign: 'center',
    marginTop: space.xl,
  },
  playerCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.lg,
  },
  playerName: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.amber,
    marginBottom: space.md,
  },
  statsGrid: {
    gap: space.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
  },
  statValue: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.text,
  },
});
