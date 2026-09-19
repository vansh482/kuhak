import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { color, font, fontSize, radius, space } from '../src/theme/tokens';
import { t } from '../src/i18n';

const STEPS = [
  { emoji: '🤫', key: 'rules.step1' as const },
  { emoji: '💬', key: 'rules.step2' as const },
  { emoji: '🤔', key: 'rules.step3' as const },
  { emoji: '👆', key: 'rules.step4' as const },
];

export default function RulesScreen() {
  const insets = useSafeAreaInsets();
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <View style={styles.nav}>
        <Animated.View style={backAnimStyle}>
          <Pressable
            onPress={() => router.back()}
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
        <Text style={styles.navTitle}>{t('rules.title')}</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
            </View>
            <Text style={styles.stepText}>{t(step.key)}</Text>
          </View>
        ))}
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
    paddingBottom: space.xl,
    gap: space.md,
  },
  stepCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.lg,
    gap: space.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontFamily: font.heading,
    fontSize: fontSize.small,
    color: color.amber,
  },
  stepEmoji: {
    fontSize: 20,
  },
  stepText: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
    lineHeight: 24,
  },
});
