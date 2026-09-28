import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/state/authStore';

/** Typing this exact word unlocks the button - deleting is permanent, so one tap must never be enough. */
const CONFIRM_WORD = 'LÖSCHEN';

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">Konto löschen</ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Dein Konto und alle deine Daten werden sofort und endgültig gelöscht:
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            • Profil, Benutzername und Profilbild{'\n'}• alle Antworten und Tipps{'\n'}• Freundschaften, Flammen und
            Favoriten{'\n'}• Meldungen und Blockierungen
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Das kann nicht rückgängig gemacht werden. Deine Freunde sehen dich danach nicht mehr.
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
            disabled={!confirmed || deleting}
            accessibilityRole="button"
            accessibilityState={{ disabled: !confirmed || deleting }}
            style={[styles.deleteButton, { backgroundColor: theme.danger, opacity: confirmed && !deleting ? 1 : 0.4 }]}>
            <ThemedText type="smallBold" style={styles.deleteLabel}>
              {deleting ? 'Lösche …' : 'Konto endgültig löschen'}
            </ThemedText>
          </Pressable>

          {error ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scroll: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  deleteButton: {
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  deleteLabel: {
    color: '#FFFFFF',
  },
});
