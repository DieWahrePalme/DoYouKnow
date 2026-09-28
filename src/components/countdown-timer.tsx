import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { msUntilNextDay, useAppStore } from '@/state/appStore';

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}min übrig`;
  return `${minutes}min übrig`;
}

type ResetState = 'idle' | 'confirming' | 'resetting' | 'done';

export function CountdownTimer() {
  const theme = useTheme();
  const checkDayRollover = useAppStore((state) => state.checkDayRollover);
  const resetToday = useAppStore((state) => state.resetToday);
  // Starts `null` so the very first client render matches the static
  // export's server-prerendered markup (frozen at build time) instead of
  // immediately showing a different, real countdown - a mismatch there
  // would throw a hydration error. Ticks for real right after mount.
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [resetState, setResetState] = useState<ResetState>('idle');
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const interval = setInterval(() => {
      checkDayRollover();
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [checkDayRollover]);

  async function handleResetPress() {
    if (resetState !== 'confirming') {
      setResetError(null);
      setResetState('confirming');
      return;
    }
    setResetState('resetting');
    const error = await resetToday();
    setResetError(error);
    setResetState(error ? 'idle' : 'done');
  }

  const resetLabel = {
    idle: '🧪 Heute zurücksetzen',
    confirming: 'Wirklich? Nochmal tippen',
    resetting: 'Setze zurück …',
    done: '✓ Zurückgesetzt',
  }[resetState];

  return (
    <View style={[styles.wrap, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">
        ⏳ {nowMs === null ? 'Neue Themen bald' : `Neue Themen in ${formatCountdown(msUntilNextDay(new Date(nowMs)))}`}
      </ThemedText>
      <View style={styles.testRow}>
        <Pressable
          onPress={handleResetPress}
          disabled={resetState === 'resetting'}
          accessibilityRole="button"
          accessibilityHint="Löscht deine Antworten auf die heutige Karte und deine heutigen Tipps"
          style={[
            styles.testButton,
            { borderColor: resetState === 'confirming' ? theme.danger : theme.textSecondary },
          ]}>
          <ThemedText type="small" style={resetState === 'confirming' ? { color: theme.danger } : undefined}>
            {resetLabel}
          </ThemedText>
        </Pressable>
        {resetState === 'confirming' ? (
          <Pressable onPress={() => setResetState('idle')} accessibilityRole="button">
            <ThemedText type="small" themeColor="textSecondary">
              Abbrechen
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {resetError ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {resetError}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Spacing.three,
    padding: Spacing.two,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  testButton: {
    borderWidth: 1,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
});
