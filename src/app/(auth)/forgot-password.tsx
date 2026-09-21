import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/state/authStore';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    clearError();
    setLoading(true);
    const { error: resetError } = await resetPassword(email.trim());
    setLoading(false);
    if (!resetError) setSent(true);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Passwort zurücksetzen
        </ThemedText>

        {sent ? (
          <ThemedText type="default" themeColor="textSecondary" style={styles.subheading}>
            Falls {email} bei uns registriert ist, haben wir dir einen Link zum Zurücksetzen geschickt.
          </ThemedText>
        ) : (
          <>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subheading}>
              Gib deine E-Mail-Adresse ein - wir schicken dir einen Link zum Zurücksetzen.
            </ThemedText>
            <TextField
              label="E-Mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="du@beispiel.de"
            />
            {error ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {error}
              </ThemedText>
            ) : null}
            <PrimaryButton label="Link senden" onPress={handleSubmit} loading={loading} disabled={!email} />
          </>
        )}

        <SecondaryButton label="Zurück zur Anmeldung" onPress={() => router.replace('/(auth)/login')} />
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    alignSelf: 'flex-start',
  },
  subheading: {
    alignSelf: 'flex-start',
  },
});
