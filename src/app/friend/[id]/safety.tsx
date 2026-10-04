import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { GroupedCard } from '@/components/grouped-card';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ReportReason, useFriendsStore } from '@/state/friendsStore';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Belästigung oder Mobbing' },
  { value: 'inappropriate_profile', label: 'Unangemessener Name oder Profilbild' },
  { value: 'spam', label: 'Spam oder Fake-Account' },
  { value: 'other', label: 'Etwas anderes' },
];

/** Report and/or block a person (App Store requirement for social apps). */
export default function SafetyScreen() {
  const { id, name, avatar } = useLocalSearchParams<{ id: string; name?: string; avatar?: string }>();
  const theme = useTheme();
  const reportUser = useFriendsStore((state) => state.reportUser);
  const blockUser = useFriendsStore((state) => state.blockUser);
  const displayName = name ?? 'diese Person';

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReport() {
    if (!id || !reason) return;
    setError(null);
    setReporting(true);
    const { error: reportError } = await reportUser(id, reason, details);
    setReporting(false);
    if (reportError) setError(`Meldung fehlgeschlagen: ${reportError}`);
    else setReported(true);
  }

  async function handleBlock() {
    if (!id) return;
    if (!confirmBlock) {
      setConfirmBlock(true);
      return;
    }
    setError(null);
    setBlocking(true);
    const { error: blockError } = await blockUser({ id, name: name ?? '', avatarEmoji: avatar ?? '🙂' });
    setBlocking(false);
    if (blockError) {
      setError(`Blockieren fehlgeschlagen: ${blockError}`);
      return;
    }
    router.back();
  }

  return (
    <Screen title={displayName} subtitle="Melden oder blockieren">
      <View style={styles.person}>
        <Avatar emoji={avatar ?? '🙂'} size={56} />
      </View>

      <View>
        <SectionLabel>Melden</SectionLabel>
        {reported ? (
          <View style={[styles.banner, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Ionicons name="checkmark-circle" size={22} color={theme.success} />
            <ThemedText type="small" style={styles.bannerText}>
              Danke für deine Meldung. Wir schauen sie uns an – {displayName} erfährt nicht, dass du gemeldet hast.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.reportForm}>
            <ThemedText type="small" themeColor="textSecondary">
              Was ist passiert? {displayName} erfährt nicht, dass du gemeldet hast.
            </ThemedText>
            <GroupedCard>
              {REASONS.map((option) => {
                const selected = option.value === reason;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setReason(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={styles.reason}>
                    <ThemedText style={styles.reasonText}>{option.label}</ThemedText>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={selected ? theme.primary : theme.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </GroupedCard>
            <TextField
              label="Details (optional)"
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={1000}
              placeholder="Was sollen wir wissen?"
              style={styles.details}
            />
            <PrimaryButton label="Meldung senden" onPress={handleReport} loading={reporting} disabled={!reason} />
          </View>
        )}
      </View>

      <View>
        <SectionLabel>Blockieren</SectionLabel>
        <ThemedText type="small" themeColor="textSecondary" style={styles.blockText}>
          Eure Freundschaft endet, und ihr könnt euch keine Anfragen mehr schicken. {displayName} wird nicht
          benachrichtigt. Du kannst das in den Einstellungen jederzeit rückgängig machen.
        </ThemedText>
        <Pressable
          onPress={handleBlock}
          disabled={blocking}
          accessibilityRole="button"
          style={[styles.blockButton, { borderColor: theme.danger }]}>
          <Ionicons name="ban-outline" size={18} color={theme.danger} />
          <ThemedText style={[styles.blockLabel, { color: theme.danger }]}>
            {blocking ? 'Blockiere …' : confirmBlock ? `Wirklich ${displayName} blockieren?` : `${displayName} blockieren`}
          </ThemedText>
        </Pressable>
        {confirmBlock && !blocking ? (
          <Pressable onPress={() => setConfirmBlock(false)} accessibilityRole="button" style={styles.cancel}>
            <ThemedText type="small" themeColor="textSecondary">
              Abbrechen
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  person: { marginTop: -Spacing.one },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerText: { flex: 1 },
  reportForm: { gap: Spacing.three },
  reason: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  reasonText: { flex: 1, fontSize: 15, lineHeight: 21 },
  details: { height: 96, paddingTop: Spacing.three, textAlignVertical: 'top' },
  blockText: { marginBottom: Spacing.three },
  blockButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  blockLabel: { fontFamily: FontFamily.bodyBold, fontSize: 16, lineHeight: 22 },
  cancel: { alignSelf: 'center', paddingVertical: Spacing.two },
});
