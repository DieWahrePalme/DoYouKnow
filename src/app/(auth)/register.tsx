import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarGrid } from '@/components/avatar-grid';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/state/authStore';

const MIN_PASSWORD_LENGTH = 6;
const STEPS = ['Benutzername', 'Profilbild', 'Zugangsdaten', 'Fast fertig'] as const;

function validUsername(value: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function Checkbox({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.checkRow, { backgroundColor: theme.backgroundElement }]}>
      <View
        style={[
          styles.checkBox,
          { borderColor: checked ? theme.primary : theme.textSecondary, backgroundColor: checked ? theme.primary : 'transparent' },
        ]}>
        {checked ? <ThemedText style={styles.checkMark}>✓</ThemedText> : null}
      </View>
      <View style={styles.checkText}>{children}</View>
    </Pressable>
  );
}

/**
 * Signup, one thing per step (Duolingo-style): username -> profile picture
 * -> email + password -> 16+ and privacy consent. Everything is kept in this
 * one screen's state, so going back never loses input.
 */
export default function RegisterScreen() {
  const theme = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  const checkUsernameAvailable = useAuthStore((state) => state.checkUsernameAvailable);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarEmoji, setAvatarEmoji] = useState('🙂');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOver16, setIsOver16] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const usernameError =
    username.length > 0 && !validUsername(username)
      ? 'Nur a-z, 0-9 und _, 3–20 Zeichen.'
      : usernameTaken
        ? 'Dieser Benutzername ist schon vergeben.'
        : undefined;
  const emailError = email.length > 0 && !validEmail(email) ? 'Das sieht nicht nach einer E-Mail-Adresse aus.' : undefined;
  const passwordError =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH ? `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen.` : undefined;
  const confirmError = confirmPassword.length > 0 && confirmPassword !== password ? 'Passwörter stimmen nicht überein.' : undefined;

  const canContinue = [
    validUsername(username) && !usernameTaken,
    Boolean(avatarEmoji),
    validEmail(email) && password.length >= MIN_PASSWORD_LENGTH && password === confirmPassword,
    isOver16 && acceptedPrivacy,
  ][step];

  async function handleNext() {
    clearError();
    if (step === 0) {
      setCheckingUsername(true);
      const available = await checkUsernameAvailable(username);
      setCheckingUsername(false);
      if (!available) {
        setUsernameTaken(true);
        return;
      }
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    if (!isOver16 || !acceptedPrivacy) return;
    setLoading(true);
    const { error: signUpError } = await signUp({
      email: email.trim(),
      password,
      username,
      avatarEmoji,
      confirmedAge16: true,
      acceptedPrivacy: true,
    });
    setLoading(false);
    if (!signUpError) setJustRegistered(true);
  }

  function handleBack() {
    clearError();
    if (step === 0) router.back();
    else setStep(step - 1);
  }

  if (justRegistered) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centerAll]}>
          <ThemedText style={styles.bigEmoji}>{avatarEmoji}</ThemedText>
          <ThemedText type="subtitle" style={styles.centerText}>
            Fast geschafft, {username}!
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
            📬 Wir haben dir eine Bestätigungs-E-Mail an {email.trim()} geschickt. Tipp auf den Link – danach kannst
            du dich anmelden und loslegen.
          </ThemedText>
          <PrimaryButton label="Zur Anmeldung" onPress={() => router.replace('/(auth)/login')} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.progressRow}>
          <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Zurück" hitSlop={10}>
            <ThemedText type="subtitle">‹</ThemedText>
          </Pressable>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[styles.progressFill, { backgroundColor: theme.primary, width: `${((step + 1) / STEPS.length) * 100}%` }]}
            />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {step + 1}/{STEPS.length}
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 ? (
            <>
              <ThemedText type="subtitle">Wie sollen dich deine Freunde finden?</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Dein Benutzername ist für andere sichtbar – über ihn schicken dir Freunde Anfragen.
              </ThemedText>
              <TextField
                label="Benutzername"
                value={username}
                onChangeText={(value) => {
                  setUsername(value.toLowerCase());
                  setUsernameTaken(false);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                placeholder="z. B. momo_23"
                error={usernameError}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <ThemedText type="subtitle">Wähl dein Profilbild</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Kannst du später jederzeit in den Einstellungen ändern.
              </ThemedText>
              <View style={styles.preview}>
                <ThemedText style={styles.bigEmoji}>{avatarEmoji}</ThemedText>
                <ThemedText type="smallBold">{username}</ThemedText>
              </View>
              <AvatarGrid selected={avatarEmoji} onSelect={setAvatarEmoji} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <ThemedText type="subtitle">Deine Zugangsdaten</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Damit meldest du dich an. Deine E-Mail sieht niemand außer dir.
              </ThemedText>
              <TextField
                label="E-Mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholder="du@beispiel.de"
                error={emailError}
              />
              <TextField
                label="Passwort"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder={`Mindestens ${MIN_PASSWORD_LENGTH} Zeichen`}
                error={passwordError}
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
            </>
          ) : null}

          {step === 3 ? (
            <>
              <ThemedText type="subtitle">Noch zwei Häkchen</ThemedText>
              <Checkbox checked={isOver16} onToggle={() => setIsOver16(!isOver16)}>
                <ThemedText type="default">Ich bin mindestens 16 Jahre alt.</ThemedText>
              </Checkbox>
              <Checkbox checked={acceptedPrivacy} onToggle={() => setAcceptedPrivacy(!acceptedPrivacy)}>
                <ThemedText type="default">
                  Ich habe die{' '}
                  <ThemedText type="default" style={{ color: theme.primary }} onPress={() => router.push('/privacy')}>
                    Datenschutzerklärung
                  </ThemedText>{' '}
                  gelesen und bin einverstanden.
                </ThemedText>
              </Checkbox>
            </>
          ) : null}

          {error ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
          ) : null}

          <PrimaryButton
            label={step === STEPS.length - 1 ? 'Konto erstellen' : 'Weiter'}
            onPress={handleNext}
            loading={loading || checkingUsername}
            disabled={!canContinue}
          />

          {step === 0 ? (
            <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.linkRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Schon einen Account? <ThemedText type="smallBold">Anmelden</ThemedText>
              </ThemedText>
            </Pressable>
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  centerAll: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  preview: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  bigEmoji: {
    fontSize: 56,
    lineHeight: 70,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
  checkText: {
    flex: 1,
  },
  linkRow: {
    alignItems: 'center',
  },
});
