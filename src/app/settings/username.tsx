import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';

function validUsername(value: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

export default function UsernameSettingsScreen() {
  const currentName = useAppStore((state) => state.users[state.activeUserId]?.name ?? '');
  const updateProfileName = useAppStore((state) => state.updateProfileName);
  const [username, setUsername] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const usernameError = username.length > 0 && !validUsername(username) ? 'Nur a-z, 0-9 und _, 3-20 Zeichen.' : undefined;
  const canSave = validUsername(username) && username !== currentName;

  async function handleSave() {
    setSaving(true);
    updateProfileName(username);
    setSaving(false);
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Benutzername ändern
        </ThemedText>
        <TextField
          label="Benutzername"
          value={username}
          onChangeText={(v) => setUsername(v.toLowerCase())}
          autoCapitalize="none"
          error={usernameError}
        />
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
