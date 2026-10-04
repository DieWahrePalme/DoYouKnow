import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** The one big accent action on a screen: solid accent pill. */
export function PrimaryButton({ label, onPress, loading, disabled }: PrimaryButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isDisabled ? theme.backgroundSelected : theme.primary, opacity: pressed ? 0.85 : 1 },
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme.primaryText} />
      ) : (
        <ThemedText style={[styles.label, { color: isDisabled ? theme.textSecondary : theme.primaryText }]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 16,
    lineHeight: 22,
  },
});
