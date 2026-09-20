import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { ANSWER_LABELS, FavoriteItem, ME_ID } from '@/types';
import { formatRelative } from '@/utils/formatRelative';

function FavoriteRow({ item }: { item: FavoriteItem }) {
  const theme = useTheme();
  const friend = useAppStore((state) => state.friends.find((f) => f.id === item.friendId));
  const group = useAppStore((state) => state.groups.find((g) => g.id === item.groupId));
  const value = useAppStore((state) => {
    const entries = state.history[ME_ID]?.[item.groupId]?.[item.questionId];
    return entries?.[entries.length - 1]?.value;
  });
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  if (!friend || !group) return null;
  const question = group.questions.find((q) => q.id === item.questionId);

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.rowIcon}>{group.icon}</ThemedText>
      <View style={styles.rowText}>
        <ThemedText type="small">{question?.text}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Du &amp; {friend.avatarEmoji} {friend.name}: {value ? ANSWER_LABELS[value] : ''} ·{' '}
          {formatRelative(item.likedAt)}
        </ThemedText>
      </View>
      <Pressable onPress={() => toggleFavorite(item.friendId, item.groupId, item.questionId)}>
        <ThemedText style={styles.heart}>❤️</ThemedText>
      </Pressable>
    </View>
  );
}

export default function FavoritesScreen() {
  const favorites = useAppStore((state) => state.favorites);
  const sorted = [...favorites].sort((a, b) => b.likedAt.localeCompare(a.likedAt));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          style={styles.list}
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          ListHeaderComponent={
            <>
              <ThemedText type="title" style={styles.heading}>
                Favoriten
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
                Gemeinsame Antworten, die ihr beim nächsten Treffen wirklich machen wollt.
              </ThemedText>
            </>
          }
          ListEmptyComponent={
            <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
              Noch nichts geliked. Öffne "Match" bei einem Freund und markiere gemeinsame Antworten mit ❤️.
            </ThemedText>
          }
          renderItem={({ item }) => <FavoriteRow item={item} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  list: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.one,
    flexGrow: 1,
  },
  heading: {
    fontSize: 32,
    lineHeight: 40,
    marginTop: Spacing.four,
  },
  subheading: {
    marginBottom: Spacing.three,
  },
  separator: {
    height: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  heart: {
    fontSize: 22,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
});
