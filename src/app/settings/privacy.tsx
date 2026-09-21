import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            Privacy Settings
          </ThemedText>

          <InfoRow
            icon="👥"
            title="Wer deine Antworten sieht"
            body="Deine Antworten sind für alle Personen sichtbar, die du hinzugefügt hast - damit sie raten können, wie gut sie dich kennen."
          />
          <InfoRow
            icon="🔒"
            title="Deine Zugangsdaten"
            body="E-Mail und Passwort werden von Supabase Auth verwaltet und niemals mit anderen Nutzer:innen geteilt."
          />
          <InfoRow
            icon="🗑️"
            title="Konto löschen"
            body="Noch nicht direkt in der App möglich - schreib uns, wenn du dein Konto und alle Daten dauerhaft löschen möchtest."
          />
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
