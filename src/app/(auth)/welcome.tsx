import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, MaxContentWidth, PrimaryGradient, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <LinearGradient colors={PrimaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
          <Ionicons name="help" size={44} color="#FFFFFF" />
        </LinearGradient>
        <ThemedText style={styles.title}>Do You{'\n'}Know?</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Beantworte ehrliche Fragen und finde heraus, wie gut deine Freunde dich wirklich kennen.
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Los geht’s" onPress={() => router.push('/(auth)/intro')} />
        <SecondaryButton label="Ich habe schon ein Konto" onPress={() => router.push('/(auth)/login')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 60,
    lineHeight: 62,
    letterSpacing: -2.2,
    textAlign: 'center',
    color: '#F5F5F7',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 25,
    paddingHorizontal: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
  },
});
