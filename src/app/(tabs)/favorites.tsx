import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FocusFade } from '@/components/focus-fade';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useEffectiveNow } from '@/hooks/use-effective-now';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { ANSWER_LABELS, FavoriteItem } from '@/types';
import { formatRelative } from '@/utils/formatRelative';

function FavoriteRow({ item }: { item: FavoriteItem }) {
  const theme = useTheme();
  const friend = useAppStore((state) => state.users[item.friendId]);
  const group = useAppStore((state) => state.groups.find((g) => g.id === item.groupId));
  const value = useAppStore((state) => {
    const entries = state.history[item.ownerId]?.[item.groupId]?.[item.questionId];
    return entries?.[entries.length - 1]?.value;
  });
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const now = useEffectiveNow();

  if (!friend || !group) return null;
  const question = group.questions.find((q) => q.id === item.questionId);

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText style={styles.rowIcon}>{group.icon}</ThemedText>
      <View style={styles.rowText}>
        <ThemedText type="small">{question?.text}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Du &amp; {friend.avatarEmoji} {friend.name}: {value ? ANSWER_LABELS[value] : ''}
          {now ? ` · ${formatRelative(item.likedAt, now)}` : ''}
        </ThemedText>
      </View>
      <Pressable
        onPress={() => toggleFavorite(item.friendId, item.groupId, item.questionId)}
        accessibilityRole="button"
        accessibilityLabel="Aus Favoriten entfernen"
        hitSlop={10}>
        <Ionicons name="heart" size={24} color={theme.danger} />
      </Pressable>
    </View>
  );
}

export default function FavoritesScreen() {
  const favorites = useAppStore((state) => state.favorites);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const sorted = favorites
    .filter((item) => item.ownerId === activeUserId)
    .sort((a, b) => b.likedAt.localeCompare(a.likedAt));

  return (
    <FocusFade style={styles.container}>
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
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={40} color="#8D8D9B" />
              <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
                Noch nichts geliked. Öffne „Match“ bei einem Freund und markiere gemeinsame Antworten mit dem Herz.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => <FavoriteRow item={item} />}
        />
      </SafeAreaView>
    </FocusFade>
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.one,
    flexGrow: 1,
  },
  heading: {
    fontSize: 38,
    lineHeight: 42,
    marginTop: Spacing.five,
  },
  subheading: {
    marginTop: Spacing.one,
    marginBottom: Spacing.four,
  },
  separator: {
    height: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
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
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: FontFamily.body,
  },
});
