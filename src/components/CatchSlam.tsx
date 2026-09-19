import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BRAND } from '../brand';
import { font, fontSize } from '../theme/tokens';
import { t } from '../i18n';
import { useGameStore } from '../store';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface CatchSlamProps {
  onDismiss: () => void;
}

/**
 * Full-screen overlay shown when the imposter is caught.
 * Scales BRAND.catchWord from 1.5x to 1.0x with a spring settle,
 * fires a heavy haptic, then auto-dismisses after 1.5s.
 */
export default function CatchSlam({ onDismiss }: CatchSlamProps) {
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const scale = useSharedValue(1.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fire heavy haptic on mount
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Animate in
    opacity.value = withTiming(1, { duration: 150 });
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
      mass: 0.8,
    });

    // Auto-dismiss after 1.5s
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      {/* Radial glow behind text */}
      <View style={styles.glow} />

      <Animated.Text style={[styles.catchWord, textStyle]}>
        {BRAND.catchWord}
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, textStyle]}>
        {t('play.wasTheImposter', { name: '' }).includes('was')
          ? 'Imposter caught'
          : 'Imposter caught'}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  glow: {
    position: 'absolute',
    width: SCREEN_W * 0.8,
    height: SCREEN_W * 0.8,
    borderRadius: SCREEN_W * 0.4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  catchWord: {
    fontFamily: font.display,
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.h2,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 12,
    textAlign: 'center',
  },
});
