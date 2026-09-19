import { View, Text, StyleSheet, Pressable, Switch, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { color, font, fontSize, radius, space } from '../src/theme/tokens';
import { BRAND } from '../src/brand';
import { t } from '../src/i18n';
import { useGameStore } from '../src/store';
import type { ImposterHint } from '../src/game/types';

const TIMER_OPTIONS = [
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
];

const HINT_OPTIONS: { label: string; value: ImposterHint }[] = [
  { label: t('settings.hintNone'), value: 'none' },
  { label: t('settings.hintCategory'), value: 'category' },
  { label: t('settings.hintCategoryHint'), value: 'category_hint' },
];

function NavBar() {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.nav}>
      <Animated.View style={animStyle}>
        <Pressable
          onPress={() => router.back()}
          onPressIn={() => {
            scale.value = withSpring(0.97, { damping: 15 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15 });
          }}
          style={styles.navBackBtn}
          hitSlop={12}
        >
          <Text style={styles.navBackText}>{'←'}</Text>
        </Pressable>
      </Animated.View>
      <Text style={styles.navTitle}>{t('settings.title')}</Text>
      <View style={styles.navSpacer} />
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: color.surface, true: color.amberSoft }}
        thumbColor={value ? color.amber : color.text3}
      />
    </View>
  );
}

function ChipSelector<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onSelect(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    timerSeconds,
    setTimerSeconds,
    imposterHint,
    setImposterHint,
    resetAll,
  } = useGameStore();

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const dangerScale = useSharedValue(1);
  const dangerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dangerScale.value }],
  }));

  const handleReset = () => {
    Alert.alert(t('settings.resetAll'), t('settings.resetConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => resetAll(),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <NavBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + space.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sound & Haptics */}
        <View style={styles.section}>
          <ToggleRow
            label={t('settings.sound')}
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
          <ToggleRow
            label={t('settings.haptics')}
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
          />
        </View>

        {/* Default timer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.defaultTimer')}</Text>
          <ChipSelector
            options={TIMER_OPTIONS.map((o) => ({
              label: o.label,
              value: o.seconds,
            }))}
            selected={timerSeconds}
            onSelect={setTimerSeconds}
          />
        </View>

        {/* Imposter hint */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.imposterHint')}</Text>
          <ChipSelector
            options={HINT_OPTIONS}
            selected={imposterHint}
            onSelect={setImposterHint}
          />
        </View>

        {/* Danger zone */}
        <View style={styles.dangerSection}>
          <Animated.View style={dangerAnimStyle}>
            <Pressable
              onPress={handleReset}
              onPressIn={() => {
                dangerScale.value = withSpring(0.97, { damping: 15 });
              }}
              onPressOut={() => {
                dangerScale.value = withSpring(1, { damping: 15 });
              }}
              style={styles.dangerBtn}
            >
              <Text style={styles.dangerBtnText}>{t('settings.resetAll')}</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>
            {t('settings.version', { version })}
          </Text>
          <Pressable
            onPress={() => Linking.openURL(BRAND.privacyUrl)}
            hitSlop={8}
          >
            <Text style={styles.footerLink}>{t('settings.privacy')}</Text>
          </Pressable>
        </View>
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
    paddingTop: space.xl,
    gap: space.xl,
  },
  section: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.md,
    gap: space.md,
  },
  sectionTitle: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.text,
    marginBottom: space.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  settingLabel: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  chipActive: {
    backgroundColor: color.amberSoft,
    borderColor: color.amber,
  },
  chipText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text2,
  },
  chipTextActive: {
    color: color.amber,
  },
  dangerSection: {
    alignItems: 'flex-start',
  },
  dangerBtn: {
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.coralGlow,
    borderWidth: 1,
    borderColor: color.coral,
  },
  dangerBtnText: {
    fontFamily: font.heading,
    fontSize: fontSize.body,
    color: color.coral,
  },
  footer: {
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.lg,
  },
  footerVersion: {
    fontFamily: font.body,
    fontSize: fontSize.small,
    color: color.text4,
  },
  footerLink: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text2,
    textDecorationLine: 'underline',
  },
});
