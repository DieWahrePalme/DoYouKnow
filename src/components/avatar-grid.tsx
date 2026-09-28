import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { AVATAR_CHOICES } from '@/data/mockData';
import { useTheme } from '@/hooks/use-theme';

interface AvatarGridProps {
  selected: string | undefined;
  onSelect: (emoji: string) => void;
}

/** The emoji profile-picture choices - used in signup and in Settings. */
export function AvatarGrid({ selected, onSelect }: AvatarGridProps) {
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {AVATAR_CHOICES.map((emoji) => {
        const isSelected = emoji === selected;
        return (
          <Pressable
            key={emoji}
            onPress={() => onSelect(emoji)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Profilbild ${emoji}`}
            style={[
              styles.choice,
              { backgroundColor: theme.backgroundElement },
              isSelected && { borderColor: theme.primary, borderWidth: 2 },
            ]}>
            <ThemedText style={styles.choiceEmoji}>{emoji}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  choice: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceEmoji: {
    fontSize: 30,
    lineHeight: 38,
  },
});
