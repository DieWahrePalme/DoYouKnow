import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, PrimaryGradient, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={PrimaryGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.hero}>
        <SafeAreaView style={styles.heroContent}>
          <View style={styles.logoBadge}>
            <ThemedText style={styles.logoEmoji}>🤔</ThemedText>
          </View>
          <ThemedText type="title" style={styles.heroTitle}>
            Do You Know?
          </ThemedText>
          <ThemedText type="default" style={styles.heroSubtitle}>
            Beantworte ehrliche Fragen und finde heraus, wie gut deine Freunde dich wirklich kennen.
          </ThemedText>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.actions} edges={['bottom']}>
        <PrimaryButton label="Konto erstellen" onPress={() => router.push('/(auth)/register')} />
        <SecondaryButton label="Anmelden" onPress={() => router.push('/(auth)/login')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  hero: {
    flex: 1,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  logoEmoji: {
    fontSize: 48,
  },
  heroTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 24,
  },
  actions: {
    padding: Spacing.four,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
