import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
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
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">
            {avatar ?? ''} {displayName}
          </ThemedText>

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Melden
          </ThemedText>
          {reported ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="small">
                ✅ Danke für deine Meldung. Wir schauen sie uns an – {displayName} erfährt nicht, dass du gemeldet hast.
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Was ist passiert? {displayName} erfährt nicht, dass du gemeldet hast.
              </ThemedText>
              <View style={styles.reasons}>
                {REASONS.map((option) => {
                  const selected = option.value === reason;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setReason(option.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[
                        styles.reason,
                        {
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                        },
                      ]}>
                      <ThemedText type="small">{option.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <TextField
                label="Details (optional)"
                value={details}
                onChangeText={setDetails}
                multiline
                maxLength={1000}
                placeholder="Was sollen wir wissen?"
              />
              <PrimaryButton label="Meldung senden" onPress={handleReport} loading={reporting} disabled={!reason} />
            </>
          )}

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Blockieren
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Eure Freundschaft endet, und ihr könnt euch keine Anfragen mehr schicken. {displayName} wird nicht
            benachrichtigt. Du kannst das in den Einstellungen jederzeit rückgängig machen.
          </ThemedText>
          <Pressable
            onPress={handleBlock}
            disabled={blocking}
            accessibilityRole="button"
            style={[styles.blockButton, { borderColor: theme.danger }]}>
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
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

          {error ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
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
  sectionLabel: {
    marginTop: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  reasons: {
    gap: Spacing.two,
  },
  reason: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  blockButton: {
    borderWidth: 1,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
  },
});
