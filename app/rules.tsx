import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, fontSize, radius, space } from '../src/theme/tokens';
import { t } from '../src/i18n';
import NavBar from '../src/components/NavBar';

const STEPS = [
  { emoji: '🤫', key: 'rules.step1' as const },
  { emoji: '💬', key: 'rules.step2' as const },
  { emoji: '🤔', key: 'rules.step3' as const },
  { emoji: '👆', key: 'rules.step4' as const },
];

export default function RulesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <NavBar title={t('rules.title')} />

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
