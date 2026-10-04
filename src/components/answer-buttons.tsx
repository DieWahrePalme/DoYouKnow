import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AnswerValue } from '@/types';

interface AnswerButtonsProps {
  onAnswer: (value: AnswerValue) => void;
}

const BUTTONS: { value: AnswerValue; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'no', label: 'Nein', icon: 'close' },
  { value: 'leanNo', label: 'Eher nein', icon: 'arrow-down' },
  { value: 'leanYes', label: 'Eher ja', icon: 'arrow-up' },
  { value: 'yes', label: 'Ja', icon: 'checkmark' },
];

const BUTTON_SIZE = 60;

/** Round icon buttons with the label underneath; all four answers look the same on purpose. */
export function AnswerButtons({ onAnswer }: AnswerButtonsProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {BUTTONS.map((button) => (
        <View key={button.value} style={styles.item}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={button.label}
            onPress={() => onAnswer(button.value)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}>
            <Ionicons name={button.icon} size={26} color={theme.text} />
          </Pressable>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.label}
            maxFontSizeMultiplier={1.3}
            accessibilityElementsHidden
            importantForAccessibility="no">
            {button.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  item: {
    alignItems: 'center',
    gap: Spacing.two,
    width: 76,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
