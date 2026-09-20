import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Dimensions,
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
import NavBar from '../src/components/NavBar';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;

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
  const isCommittingRef = useRef(false);

  const handleTap = () => {
    setEditValue(name);
    setEditing(true);
    setTimeout(() => editRef.current?.focus(), 100);
  };

  const handleDoneEditing = () => {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    }
    setEditing(false);
    setTimeout(() => { isCommittingRef.current = false; }, 100);
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
  const { roster, addPlayer, removePlayer, renamePlayer, setRoster, clearRoster, activeGroupId, savedGroups, saveCurrentGroup, updateGroup, deleteGroup, loadGroup } = useGameStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isNaming, setIsNaming] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const inputRef = useRef<TextInput>(null);
  const groupInputRef = useRef<TextInput>(null);
  const isSubmittingRef = useRef(false);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    subtitle?: string;
    onConfirm: () => void;
  } | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);

  useEffect(() => {
    if (!toastText) return;
    const t = setTimeout(() => setToastText(null), 1800);
    return () => clearTimeout(t);
  }, [toastText]);

  const canContinue = roster.length >= MIN_PLAYERS;
  const canAdd = roster.length < MAX_PLAYERS;

  const handleAddPlayer = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const trimmed = newName.trim();
    if (trimmed) {
      addPlayer(trimmed);
      setNewName('');
    }
    setIsAdding(false);
    setTimeout(() => { isSubmittingRef.current = false; }, 100);
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
      setGroupNameInput('');
      setIsNaming(true);
      setTimeout(() => groupInputRef.current?.focus(), 100);
    }
  };

  const handleConfirmGroupName = () => {
    const trimmed = groupNameInput.trim();
    if (trimmed) {
      saveCurrentGroup(trimmed);
      setToastText(`Group "${trimmed}" saved!`);
    }
    setIsNaming(false);
    setGroupNameInput('');
  };

  const handleDeleteGroup = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${name}"?`)) {
        deleteGroup(id);
      }
    } else {
      setConfirmModal({
        title: t('roster.deleteGroup'),
        subtitle: name,
        onConfirm: () => deleteGroup(id),
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.md }]}>
      <NavBar title={t('roster.title')} subtitle={activeGroup?.name} />

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
            onRemove={() =>
              setConfirmModal({
                title: t('roster.holdToRemove'),
                subtitle: player.name,
                onConfirm: () => removePlayer(player.id),
              })
            }
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
                    setToastText(`Group "${activeGroup.name}" updated!`);
                  }
                }}
              />
            )}
            {isNaming ? (
              <View style={styles.groupNameRow}>
                <TextInput
                  ref={groupInputRef}
                  value={groupNameInput}
                  onChangeText={setGroupNameInput}
                  onSubmitEditing={handleConfirmGroupName}
                  placeholder={t('roster.groupNamePrompt')}
                  placeholderTextColor={color.text3}
                  style={styles.groupNameInput}
                  returnKeyType="done"
                  maxLength={20}
                  autoCapitalize="words"
                />
                <Pressable onPress={handleConfirmGroupName} style={styles.groupNameSaveBtn}>
                  <Text style={styles.groupNameSaveBtnText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <SecondaryButton
                label={t('roster.saveGroup')}
                onPress={handleSaveGroup}
              />
            )}
          </View>
        )}
        {roster.length > 0 && (
          <View style={styles.startFreshRow}>
            <Pressable onPress={clearRoster} style={styles.startFreshBtn}>
              <Text style={styles.startFreshText}>{t('roster.startFresh')}</Text>
            </Pressable>
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

      {/* Confirm modal */}
      <Modal
        visible={!!confirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setConfirmModal(null)}
        >
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{confirmModal?.title}</Text>
            {confirmModal?.subtitle && (
              <Text style={styles.modalSubtitle}>{confirmModal.subtitle}</Text>
            )}
            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setConfirmModal(null)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={() => {
                  confirmModal?.onConfirm();
                  setConfirmModal(null);
                }}
              >
                <Text style={styles.modalConfirmText}>{t('common.confirm')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toast */}
      {toastText && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastText}</Text>
          </View>
        </View>
      )}
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
  groupNameRow: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    width: '100%',
  },
  groupNameInput: {
    flex: 1,
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.amber,
    paddingVertical: 10,
    paddingHorizontal: space.md,
  },
  groupNameSaveBtn: {
    backgroundColor: color.amber,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: space.md,
  },
  groupNameSaveBtnText: {
    fontFamily: font.headingSemi,
    fontSize: fontSize.body,
    color: color.bg,
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

  // ── Start fresh ──
  startFreshRow: {
    marginTop: space.sm,
    alignItems: 'center',
  },
  startFreshBtn: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  startFreshText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.small,
    color: color.text3,
    textDecorationLine: 'underline',
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: Dimensions.get('window').width * 0.78,
    backgroundColor: color.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderLight,
    padding: space.lg,
    alignItems: 'center',
    gap: space.md,
  },
  modalTitle: {
    fontFamily: font.heading,
    fontSize: fontSize.h2,
    color: color.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.text2,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: space.md,
    width: '100%',
    marginTop: space.sm,
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

  // ── Toast ──
  toastWrap: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: color.surfaceElevated,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  toastText: {
    fontFamily: font.bodyMedium,
    fontSize: fontSize.body,
    color: color.amber,
  },
});
