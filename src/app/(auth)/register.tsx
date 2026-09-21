import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/state/authStore';

function validUsername(value: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

export default function RegisterScreen() {
  const theme = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const usernameError = username.length > 0 && !validUsername(username) ? 'Nur a-z, 0-9 und _, 3-20 Zeichen.' : undefined;
  const confirmError = confirmPassword.length > 0 && confirmPassword !== password ? 'Passwörter stimmen nicht überein.' : undefined;
  const canSubmit = email && password.length >= 6 && validUsername(username) && password === confirmPassword;

  async function handleSubmit() {
    clearError();
    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password, username.trim().toLowerCase());
    setLoading(false);
    if (!signUpError) {
      setJustRegistered(true);
    }
  }

  if (justRegistered) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centerAll]}>
          <ThemedText style={styles.confirmEmoji}>📬</ThemedText>
          <ThemedText type="subtitle" style={styles.centerText}>
            Fast geschafft
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
            Wir haben dir eine Bestätigungs-E-Mail an {email} geschickt. Bestätige sie und melde dich danach an.
          </ThemedText>
          <PrimaryButton label="Zur Anmeldung" onPress={() => router.replace('/(auth)/login')} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.heading}>
            Konto erstellen
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subheading}>
            Nur ein paar Angaben, dann kann es losgehen.
          </ThemedText>

          <TextField
            label="Benutzername"
            value={username}
            onChangeText={(v) => setUsername(v.toLowerCase())}
            autoCapitalize="none"
            placeholder="z.B. momo_23"
            error={usernameError}
          />
          <TextField
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="du@beispiel.de"
          />
          <TextField
            label="Passwort"
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

          <PrimaryButton label="Registrieren" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />

          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.linkRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Schon einen Account? <ThemedText type="smallBold">Anmelden</ThemedText>
            </ThemedText>
          </Pressable>
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
  centerAll: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  confirmEmoji: {
    fontSize: 56,
    textAlign: 'center',
  },
  scroll: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  heading: {
    marginBottom: -Spacing.one,
  },
  subheading: {
    marginBottom: Spacing.two,
  },
  linkRow: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
