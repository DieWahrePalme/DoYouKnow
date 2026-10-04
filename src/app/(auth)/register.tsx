import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthHeading } from '@/components/auth-heading';
import { AvatarGrid } from '@/components/avatar-grid';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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
      style={[styles.checkRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View
        style={[
          styles.checkBox,
          { borderColor: checked ? theme.primary : theme.textSecondary, backgroundColor: checked ? theme.primary : 'transparent' },
        ]}>
        {checked ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
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
          <View style={[styles.avatarRing, { backgroundColor: theme.backgroundElement, borderColor: theme.primary }]}>
            <ThemedText style={styles.bigEmoji}>{avatarEmoji}</ThemedText>
          </View>
          <ThemedText style={[styles.doneTitle, styles.centerText]}>Fast geschafft, {username}!</ThemedText>
          <View style={styles.mailRow}>
            <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary" style={styles.mailText}>
              Wir haben dir eine Bestätigungs-E-Mail an {email.trim()} geschickt. Tipp auf den Link – danach kannst du
              dich anmelden und loslegen.
            </ThemedText>
          </View>
          <View style={styles.fullWidth}>
            <PrimaryButton label="Zur Anmeldung" onPress={() => router.replace('/(auth)/login')} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.progressRow}>
          <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Zurück" hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </Pressable>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[styles.progressFill, { backgroundColor: theme.primary, width: `${((step + 1) / STEPS.length) * 100}%` }]}
            />
          </View>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {step + 1}/{STEPS.length}
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 ? (
            <>
              <AuthHeading
                title="Wie sollen dich deine Freunde finden?"
                subtitle="Dein Benutzername ist für andere sichtbar – über ihn schicken dir Freunde Anfragen."
              />
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
              <AuthHeading title="Wähl dein Profilbild" subtitle="Kannst du später jederzeit in den Einstellungen ändern." />
              <View style={styles.preview}>
                <View style={[styles.avatarRing, { backgroundColor: theme.backgroundElement, borderColor: theme.primary }]}>
                  <ThemedText style={styles.bigEmoji}>{avatarEmoji}</ThemedText>
                </View>
                <ThemedText type="smallBold">{username}</ThemedText>
              </View>
              <AvatarGrid selected={avatarEmoji} onSelect={setAvatarEmoji} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <AuthHeading title="Deine Zugangsdaten" subtitle="Damit meldest du dich an. Deine E-Mail sieht niemand außer dir." />
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
              <AuthHeading title="Noch zwei Häkchen" />
              <Checkbox checked={isOver16} onToggle={() => setIsOver16(!isOver16)}>
                <ThemedText type="default">Ich bin mindestens 16 Jahre alt.</ThemedText>
              </Checkbox>
              <Checkbox checked={acceptedPrivacy} onToggle={() => setAcceptedPrivacy(!acceptedPrivacy)}>
                <ThemedText type="default">
                  Ich habe die{' '}
                  <ThemedText type="default" style={{ color: theme.textAccent }} onPress={() => router.push('/privacy')}>
                    Datenschutzerklärung
                  </ThemedText>{' '}
                  gelesen und bin einverstanden.
                </ThemedText>
              </Checkbox>
            </>
          ) : null}

          {error ? (
            <ThemedText type="small" themeColor="danger">
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
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  preview: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigEmoji: {
    fontSize: 48,
    lineHeight: 60,
  },
  doneTitle: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
  },
  mailRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  mailText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    flex: 1,
  },
  linkRow: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
