import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/state/authStore';

export default function PasswordSettingsScreen() {
  const theme = useTheme();
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const confirmError = confirmPassword.length > 0 && confirmPassword !== password ? 'Passwörter stimmen nicht überein.' : undefined;
  const canSave = password.length >= 6 && password === confirmPassword;

  async function handleSave() {
    clearError();
    setSaving(true);
    const { error: saveError } = await updatePassword(password);
    setSaving(false);
    if (!saveError) router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Passwort ändern
        </ThemedText>
        <TextField
          label="Neues Passwort"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Mindestens 6 Zeichen"
        />
        <TextField
          label="Passwort bestätigen"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="••••••••"
          error={confirmError}
        />
        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}
        <PrimaryButton label="Speichern" onPress={handleSave} loading={saving} disabled={!canSave} />
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  heading: {
    alignSelf: 'flex-start',
  },
});
