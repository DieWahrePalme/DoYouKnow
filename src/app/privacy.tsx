import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { PRIVACY_POLICY, PRIVACY_POLICY_UPDATED } from '@/data/privacyPolicy';

/**
 * Public privacy policy - reachable signed in or not (it isn't inside a
 * Stack.Protected group), linked from the signup consent step, from
 * Settings, and usable as the App Store privacy URL (/privacy on web).
 */
export default function PrivacyPolicyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Datenschutz' }} />
      <Screen title="Datenschutzerklärung" subtitle={`Stand: ${PRIVACY_POLICY_UPDATED}`}>
        {PRIVACY_POLICY.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.sectionBody}>
              {section.body}
            </ThemedText>
          </View>
        ))}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.one, marginTop: Spacing.two },
  sectionTitle: { fontFamily: FontFamily.display, fontSize: 19, lineHeight: 24, letterSpacing: -0.4, color: '#F5F5F7' },
  sectionBody: { fontSize: 15, lineHeight: 23 },
});
