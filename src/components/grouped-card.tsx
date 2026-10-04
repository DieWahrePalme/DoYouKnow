import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GroupedCardProps {
  children: ReactNode;
}

/** One rounded surface that groups rows, with hairline dividers between them. */
export function GroupedCard({ children }: GroupedCardProps) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {rows.map((row, i) => (
        <View
          key={i}
          style={i > 0 ? { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth } : undefined}>
          {row}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
