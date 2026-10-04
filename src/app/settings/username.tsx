import { router } from 'expo-router';
import { useState } from 'react';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
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
    <Screen title="Benutzername ändern" subtitle="Über deinen Benutzernamen finden dich Freunde.">
      <TextField
        label="Benutzername"
        value={username}
        onChangeText={(v) => setUsername(v.toLowerCase())}
        autoCapitalize="none"
        autoCorrect={false}
        error={usernameError}
      />
      <PrimaryButton label="Speichern" onPress={handleSave} loading={saving} disabled={!canSave} />
    </Screen>
  );
}
