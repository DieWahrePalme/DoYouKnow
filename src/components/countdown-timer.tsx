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

export function CountdownTimer() {
  const theme = useTheme();
  const timeOffsetMs = useAppStore((state) => state.timeOffsetMs);
  const advanceTimeBy = useAppStore((state) => state.advanceTimeBy);
  const jumpToNextDay = useAppStore((state) => state.jumpToNextDay);
  const resetTimeOffset = useAppStore((state) => state.resetTimeOffset);
  const checkDayRollover = useAppStore((state) => state.checkDayRollover);
  // Starts `null` so the very first client render matches the static
  // export's server-prerendered markup (frozen at build time) instead of
  // immediately showing a different, real countdown - a mismatch there
  // would throw a hydration error. Ticks for real right after mount.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const interval = setInterval(() => {
      checkDayRollover();
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [checkDayRollover]);

  return (
    <View style={[styles.wrap, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">
        ⏳ {nowMs === null ? 'Neue Themen bald' : `Neue Themen in ${formatCountdown(msUntilNextDay(new Date(nowMs + timeOffsetMs)))}`}
      </ThemedText>
      <View style={styles.testRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Test:
        </ThemedText>
        <Pressable
          onPress={() => advanceTimeBy(60 * 60 * 1000)}
          style={[styles.testButton, { borderColor: theme.textSecondary }]}>
          <ThemedText type="small">+1 Std</ThemedText>
        </Pressable>
        <Pressable
          onPress={jumpToNextDay}
          style={[styles.testButton, { borderColor: theme.textSecondary }]}>
          <ThemedText type="small">⏭ Tageswechsel</ThemedText>
        </Pressable>
        {timeOffsetMs !== 0 ? (
          <Pressable
            onPress={resetTimeOffset}
            style={[styles.testButton, { borderColor: theme.danger }]}>
            <ThemedText type="small" style={{ color: theme.danger }}>
              ↺ Jetzt
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
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
