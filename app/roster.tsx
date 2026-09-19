import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
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

function NavBar({ groupName }: { groupName?: string }) {
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
        <Text style={styles.navTitle}>{t('roster.title')}</Text>
        {groupName && (
          <Text style={styles.navSubtitle}>{groupName}</Text>
        )}
      </View>
      <View style={styles.navSpacer} />
    </View>
  );
}

function PlayerRow({
  index,
  name,
  onRemove,
  onRename,
}: {
  index: number;
  name: string;
  onRemove: () => void;
  onRename: (newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const editRef = useRef<TextInput>(null);

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

  const handleTap = () => {
    setEditValue(name);
    setEditing(true);
    setTimeout(() => editRef.current?.focus(), 100);
  };

  const handleDoneEditing = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  return (
    <View style={styles.playerRow}>
      <Pressable onPress={handleTap} style={styles.playerRowContent}>
        <View style={styles.playerBadge}>
          <Text style={styles.playerBadgeText}>{index + 1}</Text>
        </View>
        {editing ? (
          <TextInput
            ref={editRef}
            value={editValue}
            onChangeText={setEditValue}
            onSubmitEditing={handleDoneEditing}
            onBlur={handleDoneEditing}
            style={styles.playerNameInput}
            returnKeyType="done"
            maxLength={20}
            autoCapitalize="words"
            selectTextOnFocus
          />
        ) : (
          <Text style={styles.playerName}>{name}</Text>
        )}
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
        <Text style={styles.removeBtnText}>×</Text>
      </Pressable>
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
  const { roster, addPlayer, removePlayer, renamePlayer, setRoster, activeGroupId, savedGroups, saveCurrentGroup, updateGroup, deleteGroup, loadGroup } = useGameStore();
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

  const activeGroup = savedGroups.find((g) => g.id === activeGroupId);

  const handleSaveGroup = () => {
    if (Platform.OS === 'web') {
      const name = window.prompt(t('roster.groupNamePrompt'));
      if (name?.trim()) {
        saveCurrentGroup(name.trim());
        window.alert(`Group "${name.trim()}" saved!`);
      }
    } else {
      Alert.prompt?.(
        t('roster.saveGroup'),
        t('roster.groupNamePrompt'),
        (name: string) => {
          if (name?.trim()) {
            saveCurrentGroup(name.trim());
            Alert.alert(`Group "${name.trim()}" saved!`);
          }
        },
      );
    }
  };

  const handleDeleteGroup = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${name}"?`)) {
        deleteGroup(id);
      }
    } else {
      Alert.alert(t('roster.deleteGroup'), name, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'destructive', onPress: () => deleteGroup(id) },
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <NavBar groupName={activeGroup?.name} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Saved groups */}
        {savedGroups.length > 0 && (
          <View style={styles.groupsSection}>
            <Text style={styles.groupsTitle}>{t('roster.savedGroups')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupsRow}
            >
              {savedGroups.map((group) => (
                <View key={group.id} style={styles.groupChipWrap}>
                  <Pressable
                    onPress={() => loadGroup(group)}
                    style={[
                      styles.groupChip,
                      activeGroupId === group.id && styles.groupChipActive,
                    ]}
                  >
                    <Text style={styles.groupChipName}>{group.name}</Text>
                    <Text style={styles.groupChipCount}>
                      {t('roster.playerCount', { count: group.playerNames.length })}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteGroup(group.id, group.name)}
                    hitSlop={6}
                    style={styles.groupDeleteBtn}
                  >
                    <Text style={styles.groupDeleteBtnText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {roster.length > 0 && (
          <Text style={styles.orderHint}>{t('roster.orderHint')}</Text>
        )}

        {roster.map((player, i) => (
          <PlayerRow
            key={player.id}
            index={i}
            name={player.name}
            onRemove={() => removePlayer(player.id)}
            onRename={(newName) => renamePlayer(player.id, newName)}
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

        {/* Use numbers button / Save group */}
        {roster.length === 0 && (
          <View style={styles.numbersRow}>
            <SecondaryButton
              label={t('roster.useNumbers')}
              onPress={handleUseNumbers}
            />
          </View>
        )}
        {canContinue && (
          <View style={styles.groupActionsRow}>
            {activeGroupId && activeGroup && (
              <SecondaryButton
                label={t('roster.updateGroup')}
                onPress={() => {
                  updateGroup(activeGroupId);
                  if (Platform.OS === 'web') {
                    window.alert(`Group "${activeGroup.name}" updated!`);
                  } else {
                    Alert.alert(`Group "${activeGroup.name}" updated!`);
                  }
                }}
              />
            )}
            <SecondaryButton
              label={t('roster.saveGroup')}
              onPress={handleSaveGroup}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.sm,
    paddingBottom: space.xl,
  },
  groupsSection: {
    marginBottom: space.md,
  },
  groupsTitle: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.small,
    color: color.text2,
    marginBottom: space.sm,
  },
  groupsRow: {
    gap: space.sm,
  },
  groupChipWrap: {
    position: 'relative' as const,
  },
  groupChip: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    alignItems: 'center',
    minWidth: 80,
  },
  groupChipActive: {
    borderColor: color.amber,
  },
  groupDeleteBtn: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: color.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupDeleteBtnText: {
    fontFamily: font.heading,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  groupChipName: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.small,
    color: color.amber,
  },
  groupChipCount: {
    fontFamily: font.body,
    fontSize: fontSize.xs,
    color: color.text3,
    marginTop: 2,
  },
  orderHint: {
    fontFamily: font.body,
    fontSize: fontSize.small,
    color: color.text3,
    textAlign: 'center',
    marginBottom: space.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    paddingVertical: 14,
    paddingHorizontal: space.md,
  },
  playerRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: space.sm,
  },
  removeBtnText: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text3,
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
  playerNameInput: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text,
    flex: 1,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: color.amber,
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
  groupActionsRow: {
    marginTop: space.md,
    alignItems: 'center',
    gap: space.xs,
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
