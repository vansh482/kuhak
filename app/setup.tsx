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
import { PACKS, ALL_PACK_IDS, getAllEntries } from '../src/content';
import { dealRoles, pickSecret, pickHint, makeRng } from '../src/game/logic';
import type { DealtRound } from '../src/game/types';

const TIMER_OPTIONS = [
  { seconds: 0, label: 'None' },
  { seconds: 60, label: '1m' },
  { seconds: 120, label: '2m' },
  { seconds: 180, label: '3m' },
  { seconds: 300, label: '5m' },
];

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
      <Text style={styles.navTitle}>{t('setup.title')}</Text>
      <View style={styles.navSpacer} />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        disabled={disabled}
        style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
      >
        <Text style={styles.primaryBtnText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const {
    roster,
    selectedPacks,
    setSelectedPacks,
    timerSeconds,
    setTimerSeconds,
    imposterHint,
    setCurrentRound,
    usedWords,
    markWordUsed,
    resetUsedWords,
  } = useGameStore();

  const playerCount = roster.length;

  const allPackIds = ALL_PACK_IDS;
  const allSelected = allPackIds.every((id) => selectedPacks.includes(id));
  const hasMixed = selectedPacks.includes('__mixed__');

  const togglePack = (packId: string) => {
    if (selectedPacks.includes(packId)) {
      const next = selectedPacks.filter((id) => id !== packId);
      if (next.length > 0) setSelectedPacks(next);
    } else {
      // Remove __mixed__ when selecting specific packs, and vice versa
      if (packId === '__mixed__') {
        setSelectedPacks(['__mixed__']);
      } else {
        setSelectedPacks([
          ...selectedPacks.filter((id) => id !== '__mixed__'),
          packId,
        ]);
      }
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      // Deselect all: revert to default selection
      setSelectedPacks([allPackIds[0]]);
    } else {
      setSelectedPacks([...allPackIds]);
    }
  };

  const dealRound = () => {
    const state = useGameStore.getState();
    const currentRoster = state.roster;
    const currentPacks = state.selectedPacks;
    const currentUsedWords = state.usedWords;
    const currentHintMode = state.imposterHint;
    const currentTimer = state.timerSeconds;

    const rng = makeRng();
    const imposterIds = dealRoles(currentRoster, 1, rng);
    const { word, category, bagExhausted } = pickSecret(currentPacks, currentUsedWords, rng);
    if (bagExhausted) state.resetUsedWords();
    state.markWordUsed(word);
    const secret = { word, category };
    const startSeat = Math.floor(rng() * currentRoster.length);

    const resolvedPacks = currentPacks.includes('__mixed__') ? ALL_PACK_IDS : currentPacks;
    const pool = getAllEntries(resolvedPacks);
    const entry = pool.find((e) => e.word === word);
    const hint =
      (currentHintMode === 'category_hint' || currentHintMode === 'hint_only') && entry
        ? pickHint(entry, rng)
        : null;

    const round: DealtRound = {
      config: {
        players: currentRoster,
        imposterCount: 1,
        packIds: currentPacks,
        timerSeconds: currentTimer,
        imposterHint: currentHintMode,
      },
      imposterIds,
      secret,
      imposterHint: hint,
      startSeat,
    };

    state.setCurrentRound(round);
    router.push('/play');
  };

  const canDeal = selectedPacks.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <NavBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Player count badge */}
        <View style={styles.playerBadgeRow}>
          <View style={styles.playerBadge}>
            <Text style={styles.playerBadgeText}>
              {t('setup.players', { count: playerCount })}
            </Text>
          </View>
        </View>

        {/* Word packs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('setup.wordPacks')}</Text>
            <Pressable onPress={toggleAll} hitSlop={8}>
              <Text style={styles.allLink}>{t('setup.selectAll')}</Text>
            </Pressable>
          </View>
          <View style={styles.packGrid}>
            {allPackIds.map((packId) => {
              const pack = PACKS.find((p) => p.id === packId);
              const active = selectedPacks.includes(packId);
              return (
                <Pressable
                  key={packId}
                  onPress={() => togglePack(packId)}
                  style={[styles.packChip, active && styles.packChipActive]}
                >
                  <Text
                    style={[
                      styles.packChipText,
                      active && styles.packChipTextActive,
                    ]}
                  >
                    {pack?.name ?? packId}
                  </Text>
                </Pressable>
              );
            })}
            {/* Mixed chip with violet styling */}
            <Pressable
              onPress={() => togglePack('__mixed__')}
              style={[styles.packChip, hasMixed && styles.mixedChipActive]}
            >
              <Text
                style={[
                  styles.packChipText,
                  hasMixed && styles.mixedChipTextActive,
                ]}
              >
                Mixed
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('setup.timer')}</Text>
          <View style={styles.chipRow}>
            {TIMER_OPTIONS.map((opt) => {
              const active = timerSeconds === opt.seconds;
              return (
                <Pressable
                  key={opt.seconds}
                  onPress={() => setTimerSeconds(opt.seconds)}
                  style={[styles.timerChip, active && styles.timerChipActive]}
                >
                  <Text
                    style={[
                      styles.timerChipText,
                      active && styles.timerChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* Deal button */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + space.md }]}
      >
        <PrimaryButton
          label={t('setup.dealTheRound')}
          onPress={dealRound}
          disabled={!canDeal}
        />
      </View>
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
    gap: space.lg,
    paddingBottom: space.xl,
  },
  playerBadgeRow: {
    alignItems: 'center',
  },
  playerBadge: {
    backgroundColor: color.amberSoft,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: color.amber,
  },
  playerBadgeText: {
    fontFamily: font.heading,
    fontSize: fontSize.body,
    color: color.amber,
  },
  section: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.md,
    gap: space.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.text,
  },
  allLink: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.amber,
  },
  packGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  packChip: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  packChipActive: {
    backgroundColor: color.amberSoft,
    borderColor: color.amber,
  },
  packChipText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text2,
  },
  packChipTextActive: {
    color: color.amber,
  },
  mixedChipActive: {
    backgroundColor: color.violetGlow,
    borderColor: color.violet,
  },
  mixedChipTextActive: {
    color: color.violet,
  },
  chipRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  timerChip: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
  },
  timerChipActive: {
    backgroundColor: color.amberSoft,
    borderColor: color.amber,
  },
  timerChipText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text2,
  },
  timerChipTextActive: {
    color: color.amber,
  },
  bottomBar: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color.border,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: color.amber,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    width: '100%',
    shadowColor: color.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    fontFamily: font.heading,
    fontSize: fontSize.body,
    color: color.bg,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
});
