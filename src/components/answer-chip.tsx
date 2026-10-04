import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ANSWER_LABELS, AnswerValue } from '@/types';

const ANSWER_ICONS: Record<AnswerValue, keyof typeof Ionicons.glyphMap> = {
  yes: 'checkmark',
  leanYes: 'arrow-up',
  leanNo: 'arrow-down',
  no: 'close',
  never: 'ban',
};

interface AnswerChipProps {
  value: AnswerValue;
}

/** Small neutral pill: icon + answer label. All answers share one look on purpose. */
export function AnswerChip({ value }: AnswerChipProps) {
  const theme = useTheme();

  return (
    <View accessible accessibilityLabel={ANSWER_LABELS[value]} style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
      <Ionicons name={ANSWER_ICONS[value]} size={14} color={theme.text} />
      <ThemedText style={styles.label} maxFontSizeMultiplier={1.4}>
        {ANSWER_LABELS[value]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: Radius.pill,
  },
  label: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 13,
    lineHeight: 17,
  },
});
