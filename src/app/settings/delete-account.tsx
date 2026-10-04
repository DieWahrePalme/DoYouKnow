import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GroupedCard } from '@/components/grouped-card';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/state/authStore';

/** Red with white text at >= 4.5:1 (the lighter danger tone is for text on dark, not for fills). */
const DANGER_SOLID = '#CF2F4C';

/** Typing this exact word unlocks the button - deleting is permanent, so one tap must never be enough. */
const CONFIRM_WORD = 'LÖSCHEN';

const WHAT_IS_DELETED: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'person-outline', text: 'Profil, Benutzername und Profilbild' },
  { icon: 'chatbubble-ellipses-outline', text: 'Alle Antworten und Tipps' },
  { icon: 'people-outline', text: 'Freundschaften, Flammen und Favoriten' },
  { icon: 'flag-outline', text: 'Meldungen und Blockierungen' },
];

export default function DeleteAccountScreen() {
  const theme = useTheme();
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  async function handleDelete() {
    if (!confirmed) return;
    setError(null);
    setDeleting(true);
    const { error: deleteError } = await deleteAccount();
    // On success the auth listener signs out and the app switches to the welcome screen.
    if (deleteError) {
      setError(deleteError);
      setDeleting(false);
    }
  }

  const enabled = confirmed && !deleting;

  return (
    <Screen
      title="Konto löschen"
      subtitle="Dein Konto und alle deine Daten werden sofort und endgültig gelöscht. Das kann nicht rückgängig gemacht werden.">
      <GroupedCard>
        {WHAT_IS_DELETED.map((item) => (
          <View key={item.text} style={styles.item}>
            <Ionicons name={item.icon} size={20} color={theme.danger} />
            <ThemedText style={styles.itemText}>{item.text}</ThemedText>
          </View>
        ))}
      </GroupedCard>
      <ThemedText type="small" themeColor="textSecondary">
        Deine Freunde sehen dich danach nicht mehr.
      </ThemedText>

      <TextField
        label={`Zur Bestätigung „${CONFIRM_WORD}“ eingeben`}
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={CONFIRM_WORD}
      />

      <Pressable
        onPress={handleDelete}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled, busy: deleting }}
        style={[styles.deleteButton, { backgroundColor: enabled ? DANGER_SOLID : theme.backgroundSelected }]}>
        <ThemedText style={[styles.deleteLabel, { color: enabled ? '#FFFFFF' : theme.textSecondary }]}>
          {deleting ? 'Lösche …' : 'Konto endgültig löschen'}
        </ThemedText>
      </Pressable>

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  itemText: { flex: 1, fontSize: 15, lineHeight: 21 },
  deleteButton: {
    minHeight: 54,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: { fontFamily: FontFamily.bodyBold, fontSize: 16, lineHeight: 22 },
});
