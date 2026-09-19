import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { color, font, fontSize, radius, space } from '../src/theme/tokens';
import { BRAND } from '../src/brand';
import { t } from '../src/i18n';

export default function AboutScreen() {
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
      </View>

      <View style={styles.content}>
        <Text style={styles.wordmark}>{BRAND.name}</Text>

        <Text style={styles.origin}>{BRAND.origin}</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Text style={styles.madeBy}>{t('about.madeBy')}</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
  wordmark: {
    fontFamily: font.display,
    fontSize: fontSize.display,
    color: color.amber,
    letterSpacing: 6,
    marginBottom: space.xl,
  },
  origin: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: space.lg,
  },
  madeBy: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text4,
  },
});
