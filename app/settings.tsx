import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView, Dimensions, Modal } from 'react-native';
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
import NavBar from '../src/components/NavBar';

const TIMER_OPTIONS = [
  { label: 'None', seconds: 0 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
];

const { width: SCREEN_W } = Dimensions.get('window');

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

  const [showResetModal, setShowResetModal] = useState(false);

  const hintOptions: { label: string; value: ImposterHint }[] = [
    { label: t('settings.hintNone'), value: 'none' },
    { label: t('settings.hintCategory'), value: 'category' },
    { label: t('settings.hintHintOnly'), value: 'hint_only' },
    { label: t('settings.hintCategoryHint'), value: 'category_hint' },
  ];

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const dangerScale = useSharedValue(1);
  const dangerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dangerScale.value }],
  }));

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setShowResetModal(false);
    resetAll();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <NavBar title={t('settings.title')} />

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
            options={hintOptions}
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

      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowResetModal(false)}
        >
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('settings.resetAll')}</Text>
            <Text style={styles.modalBody}>{t('settings.resetConfirm')}</Text>
            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={confirmReset}
              >
                <Text style={styles.modalConfirmText}>{t('common.confirm')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
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

  // ── Reset modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: SCREEN_W * 0.78,
    backgroundColor: color.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderLight,
    padding: space.lg,
    alignItems: 'center',
    gap: space.lg,
  },
  modalTitle: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text,
    textAlign: 'center',
  },
  modalBody: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: space.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: color.surfaceElevated,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.text,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: color.coral,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: '#FFFFFF',
  },
});
