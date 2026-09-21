import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { AVATAR_CHOICES } from '@/data/mockData';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';

export default function AvatarSettingsScreen() {
  const theme = useTheme();
  const currentEmoji = useAppStore((state) => state.users[state.activeUserId]?.avatarEmoji);
  const updateProfileAvatar = useAppStore((state) => state.updateProfileAvatar);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle" style={styles.heading}>
            Profilbild wählen
          </ThemedText>
          <View style={styles.grid}>
            {AVATAR_CHOICES.map((emoji) => {
              const selected = emoji === currentEmoji;
              return (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    updateProfileAvatar(emoji);
                    router.back();
                  }}
                  style={[
                    styles.choice,
                    { backgroundColor: theme.backgroundElement },
                    selected && { borderColor: theme.primary, borderWidth: 2 },
                  ]}>
                  <ThemedText style={styles.choiceEmoji}>{emoji}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
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
  scroll: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  heading: {
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
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
  },
});
