import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { AVATAR_CHOICES } from '@/data/mockData';
import { useTheme } from '@/hooks/use-theme';

interface AvatarGridProps {
  selected: string | undefined;
  onSelect: (emoji: string) => void;
}

const COLUMNS = 4;

/** The emoji profile-picture choices - used in signup and in Settings. */
export function AvatarGrid({ selected, onSelect }: AvatarGridProps) {
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {AVATAR_CHOICES.map((emoji) => {
        const isSelected = emoji === selected;
        return (
          <View key={emoji} style={styles.cell}>
            <Pressable
              onPress={() => onSelect(emoji)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Profilbild ${emoji}`}
              style={[
                styles.choice,
                { backgroundColor: theme.backgroundElement, borderColor: isSelected ? theme.primary : theme.border },
                isSelected && styles.choiceSelected,
              ]}>
              <ThemedText style={styles.choiceEmoji}>{emoji}</ThemedText>
              {isSelected ? (
                <View style={[styles.check, { backgroundColor: theme.primary, borderColor: theme.background }]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.three,
  },
  cell: {
    width: `${100 / COLUMNS}%`,
    alignItems: 'center',
  },
  choice: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceSelected: {
    borderWidth: 2,
  },
  choiceEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  check: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
