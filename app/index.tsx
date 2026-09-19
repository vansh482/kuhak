import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { color, font, fontSize, radius, space } from '../src/theme/tokens';
import { BRAND } from '../src/brand';
import { t } from '../src/i18n';

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
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
        style={styles.primaryBtn}
      >
        <Text style={styles.primaryBtnText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function TextLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
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
        style={styles.textLink}
        hitSlop={8}
      >
        <Text style={styles.textLinkLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + space.xl },
      ]}
    >
      <View style={styles.center}>
        {/* Ambient glow behind wordmark */}
        <View style={styles.ambientGlow} />

        <Text style={styles.wordmark}>{BRAND.name}</Text>
        <Text style={styles.tagline}>{BRAND.hook}</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label={t('home.startGame')}
          onPress={() => router.push('/roster')}
        />

        <View style={styles.links}>
          <TextLink
            label={t('home.rules')}
            onPress={() => router.push('/rules')}
          />
          <TextLink
            label={t('home.settings')}
            onPress={() => router.push('/settings')}
          />
          <TextLink
            label={t('home.about')}
            onPress={() => router.push('/about')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: color.amber,
    opacity: 0.08,
  },
  wordmark: {
    fontFamily: font.display,
    fontSize: fontSize.display,
    color: color.amber,
    letterSpacing: 6,
    marginBottom: space.sm,
  },
  tagline: {
    fontFamily: font.body,
    fontSize: fontSize.body,
    color: color.text2,
    textAlign: 'center',
    paddingHorizontal: space.xl,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    paddingHorizontal: space.xl,
    gap: space.xl,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: color.amber,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: radius.md,
    alignItems: 'center',
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
  links: {
    flexDirection: 'row',
    gap: space.xl,
  },
  textLink: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  textLinkLabel: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text2,
  },
});
