import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function InfoRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.rowIcon}>{icon}</ThemedText>
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {body}
        </ThemedText>
      </View>
    </View>
  );
}

export default function PrivacySettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle" style={styles.heading}>
            Datenschutz & Konto
          </ThemedText>

          <InfoRow
            icon="👥"
            title="Wer deine Antworten sieht"
            body="Nur deine bestätigten Freunde - damit sie raten und ihre Auflösung sehen können. Niemand sonst, auch nicht über die Datenbank."
          />
          <InfoRow
            icon="🔒"
            title="Deine Zugangsdaten"
            body="E-Mail und Passwort werden von Supabase Auth verwaltet und niemals mit anderen Nutzer:innen geteilt."
          />

          <View style={styles.links}>
            <ListRow icon="📄" title="Datenschutzerklärung" onPress={() => router.push('/privacy')} />
            <ListRow icon="🚫" title="Blockierte Personen" onPress={() => router.push('/settings/blocked')} />
            <ListRow
              icon="🗑️"
              title="Konto löschen"
              subtitle="Konto und alle Daten endgültig entfernen"
              onPress={() => router.push('/settings/delete-account')}
            />
          </View>
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
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  heading: {
    marginBottom: Spacing.two,
  },
  links: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
