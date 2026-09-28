import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { PRIVACY_POLICY, PRIVACY_POLICY_UPDATED } from '@/data/privacyPolicy';

/**
 * Public privacy policy - reachable signed in or not (it isn't inside a
 * Stack.Protected group), linked from the signup consent step, from
 * Settings, and usable as the App Store privacy URL (/privacy on web).
 */
export default function PrivacyPolicyScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Datenschutz' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle">Datenschutzerklärung</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Stand: {PRIVACY_POLICY_UPDATED}
          </ThemedText>
          {PRIVACY_POLICY.map((section) => (
            <View key={section.title} style={styles.section}>
              <ThemedText type="smallBold">{section.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {section.body}
              </ThemedText>
            </View>
          ))}
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.one,
  },
});
