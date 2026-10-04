import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SmallButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'neutral' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
}

/** Compact pill for actions inside rows. */
export function SmallButton({ label, onPress, variant = 'neutral', icon, disabled, loading }: SmallButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const background = variant === 'primary' ? theme.primary : theme.backgroundSelected;
  const color = variant === 'primary' ? theme.primaryText : variant === 'danger' ? theme.danger : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={15} color={color} /> : null}
          <ThemedText style={[styles.label, { color }]}>{label}</ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    lineHeight: 18,
  },
});
