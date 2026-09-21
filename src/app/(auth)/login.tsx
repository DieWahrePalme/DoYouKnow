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

export default function LoginScreen() {
  const theme = useTheme();
  const signIn = useAuthStore((state) => state.signIn);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    clearError();
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (!signInError) {
      router.replace('/');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.heading}>
            Willkommen zurück
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subheading}>
            Melde dich mit deinem Account an.
          </ThemedText>

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
            autoComplete="password"
            placeholder="••••••••"
          />

          {error ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
          ) : null}

          <PrimaryButton label="Anmelden" onPress={handleSubmit} loading={loading} disabled={!email || !password} />

          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.linkRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Passwort vergessen?
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.replace('/(auth)/register')} style={styles.linkRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Noch keinen Account? <ThemedText type="smallBold">Registrieren</ThemedText>
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
