import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GroupedCard } from '@/components/grouped-card';
import { ListRow } from '@/components/list-row';
import { Screen } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function InfoRow({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.info}>
      <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </View>
      <View style={styles.infoText}>
        <ThemedText style={styles.infoTitle}>{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.infoBody}>
          {body}
        </ThemedText>
      </View>
    </View>
  );
}

export default function PrivacySettingsScreen() {
  return (
    <Screen title="Datenschutz & Konto">
      <GroupedCard>
        <InfoRow
          icon="people-outline"
          title="Wer deine Antworten sieht"
          body="Nur deine bestätigten Freunde - damit sie raten und ihre Auflösung sehen können. Niemand sonst, auch nicht über die Datenbank."
        />
        <InfoRow
          icon="lock-closed-outline"
          title="Deine Zugangsdaten"
          body="E-Mail und Passwort werden von Supabase Auth verwaltet und niemals mit anderen Nutzer:innen geteilt."
        />
      </GroupedCard>

      <View>
        <SectionLabel>Mehr</SectionLabel>
        <GroupedCard>
          <ListRow iconName="document-text-outline" title="Datenschutzerklärung" onPress={() => router.push('/privacy')} />
          <ListRow iconName="ban-outline" title="Blockierte Personen" onPress={() => router.push('/settings/blocked')} />
          <ListRow
            iconName="trash-outline"
            danger
            title="Konto löschen"
            subtitle="Konto und alle Daten endgültig entfernen"
            onPress={() => router.push('/settings/delete-account')}
          />
        </GroupedCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  info: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, alignItems: 'flex-start' },
  infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, gap: 3 },
  infoTitle: { fontFamily: FontFamily.bodySemi, fontSize: 16, lineHeight: 22 },
  infoBody: { lineHeight: 20 },
});
