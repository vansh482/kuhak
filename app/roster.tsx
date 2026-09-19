import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
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

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;

function NavBar() {
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  return (
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
      <Text style={styles.navTitle}>{t('roster.title')}</Text>
      <View style={styles.navSpacer} />
    </View>
  );
}

function PlayerRow({
  index,
  name,
  onRemove,
}: {
  index: number;
  name: string;
  onRemove: () => void;
}) {
  const handleLongPress = () => {
    Alert.alert(
      t('roster.holdToRemove'),
      name,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'destructive', onPress: onRemove },
      ],
    );
  };

  return (
    <Pressable onLongPress={handleLongPress} style={styles.playerRow}>
      <View style={styles.playerBadge}>
        <Text style={styles.playerBadgeText}>{index + 1}</Text>
      </View>
      <Text style={styles.playerName}>{name}</Text>
    </Pressable>
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

function SecondaryButton({
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
        style={styles.secondaryBtn}
      >
        <Text style={styles.secondaryBtnText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function RosterScreen() {
  const insets = useSafeAreaInsets();
  const { roster, addPlayer, removePlayer, setRoster } = useGameStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const canContinue = roster.length >= MIN_PLAYERS;
  const canAdd = roster.length < MAX_PLAYERS;

  const handleAddPlayer = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      addPlayer(trimmed);
      setNewName('');
    }
    setIsAdding(false);
  };

  const handleUseNumbers = () => {
    const count = 4;
    const players = Array.from({ length: count }, (_, i) => ({
      id: `p_num_${Date.now()}_${i}`,
      name: `Player ${i + 1}`,
      seat: i,
    }));
    setRoster(players);
  };

  const openAddInput = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <NavBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {roster.map((player, i) => (
          <PlayerRow
            key={player.id}
            index={i}
            name={player.name}
            onRemove={() => removePlayer(player.id)}
          />
        ))}

        {/* Add player row */}
        {canAdd && !isAdding && (
          <Pressable style={styles.addRow} onPress={openAddInput}>
            <Text style={styles.addRowPlus}>+</Text>
            <Text style={styles.addRowText}>{t('roster.addPlayer')}</Text>
          </Pressable>
        )}

        {/* Inline TextInput */}
        {isAdding && (
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAddPlayer}
              onBlur={handleAddPlayer}
              placeholder={t('roster.addPlayer')}
              placeholderTextColor={color.text3}
              style={styles.textInput}
              returnKeyType="done"
              maxLength={20}
              autoCapitalize="words"
            />
          </View>
        )}

        {/* Use numbers button */}
        {roster.length === 0 && (
          <View style={styles.numbersRow}>
            <SecondaryButton
              label={t('roster.useNumbers')}
              onPress={handleUseNumbers}
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + space.md }]}
      >
        {!canContinue && roster.length > 0 && (
          <Text style={styles.minPlayersHint}>{t('roster.minPlayers')}</Text>
        )}
        <PrimaryButton
          label={t('common.continue')}
          onPress={() => router.push('/setup')}
          disabled={!canContinue}
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
    gap: space.sm,
    paddingBottom: space.xl,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    paddingVertical: 14,
    paddingHorizontal: space.md,
  },
  playerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBadgeText: {
    fontFamily: font.heading,
    fontSize: fontSize.small,
    color: color.amber,
  },
  playerName: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text,
    flex: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: color.border,
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: space.md,
  },
  addRowPlus: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text3,
    width: 32,
    textAlign: 'center',
  },
  addRowText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text3,
  },
  inputRow: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.amber,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  textInput: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text,
    paddingVertical: 10,
  },
  numbersRow: {
    marginTop: space.md,
    alignItems: 'center',
  },
  bottomBar: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color.border,
    gap: space.sm,
    alignItems: 'center',
  },
  minPlayersHint: {
    fontFamily: font.body,
    fontSize: fontSize.small,
    color: color.text3,
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
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  secondaryBtnText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text2,
  },
});
