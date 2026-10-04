import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthHeading } from '@/components/auth-heading';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/state/authStore';

export default function ForgotPasswordScreen() {
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
        <AuthHeading
          title="Passwort zurücksetzen"
          subtitle={
            sent
              ? `Falls ${email} bei uns registriert ist, haben wir dir einen Link zum Zurücksetzen geschickt.`
              : 'Gib deine E-Mail-Adresse ein - wir schicken dir einen Link zum Zurücksetzen.'
          }
        />

        {sent ? null : (
          <>
            <TextField
              label="E-Mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="du@beispiel.de"
            />
            {error ? (
              <ThemedText type="small" themeColor="danger">
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
});
