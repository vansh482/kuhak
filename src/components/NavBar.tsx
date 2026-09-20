import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { color, font, fontSize, radius, space } from '../theme/tokens';

interface NavBarProps {
  title: string;
  subtitle?: string;
}

export default function NavBar({ title, subtitle }: NavBarProps) {
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
      <View style={styles.navCenter}>
        <Text style={styles.navTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.navSubtitle}>{subtitle}</Text>
        )}
      </View>
      <View style={styles.navSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  navCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    textAlign: 'center',
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text,
  },
  navSubtitle: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.amber,
    marginTop: 2,
  },
  navSpacer: {
    width: 40,
  },
});
