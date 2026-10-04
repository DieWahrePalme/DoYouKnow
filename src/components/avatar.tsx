import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AvatarProps {
  emoji: string;
  size?: number;
}

/** Round emoji avatar on a neutral surface (the emoji is the user's own picture, so it stays an emoji). */
export function Avatar({ emoji, size = 48 }: AvatarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: Radius.pill, backgroundColor: theme.backgroundSelected },
      ]}>
      <ThemedText style={{ fontSize: size * 0.5, lineHeight: size * 0.64 }}>{emoji}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
