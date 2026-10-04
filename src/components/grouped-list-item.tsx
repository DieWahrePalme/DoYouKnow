import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GroupedListItemProps {
  index: number;
  count: number;
  children: ReactNode;
}

/**
 * Wraps one FlatList row so consecutive rows read as a single rounded card
 * (FlatList can't wrap its items in one container, so the first/last row
 * carry the rounded corners and top/bottom border instead).
 */
export function GroupedListItem({ index, count, children }: GroupedListItemProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        index === 0 && styles.first,
        index === count - 1 && styles.last,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  first: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
  },
  last: {
    borderBottomLeftRadius: Radius.card,
    borderBottomRightRadius: Radius.card,
  },
});
