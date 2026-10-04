import { router } from 'expo-router';
import { useState } from 'react';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/state/authStore';

export default function PasswordSettingsScreen() {
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
    <Screen title="Passwort ändern" subtitle="Mindestens 6 Zeichen.">
      <TextField
        label="Neues Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
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
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      <PrimaryButton label="Speichern" onPress={handleSave} loading={saving} disabled={!canSave} />
    </Screen>
  );
}
