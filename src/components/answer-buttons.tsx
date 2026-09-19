import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AnswerValue } from '@/types';

interface AnswerButtonsProps {
  onAnswer: (value: AnswerValue) => void;
}

const BUTTONS: { value: AnswerValue; label: string }[] = [
  { value: 'no', label: '✕ Nein' },
  { value: 'leanNo', label: '↓ Eher nein' },
  { value: 'leanYes', label: '↑ Eher ja' },
  { value: 'yes', label: '✓ Ja' },
];

export function AnswerButtons({ onAnswer }: AnswerButtonsProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {BUTTONS.map((button) => (
        <Pressable
          key={button.value}
          onPress={() => onAnswer(button.value)}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
          ]}>
          <ThemedText type="smallBold">{button.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
});
