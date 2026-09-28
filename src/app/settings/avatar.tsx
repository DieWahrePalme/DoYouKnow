import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarGrid } from '@/components/avatar-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';

export default function AvatarSettingsScreen() {
  const currentEmoji = useAppStore((state) => state.users[state.activeUserId]?.avatarEmoji);
  const updateProfileAvatar = useAppStore((state) => state.updateProfileAvatar);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle" style={styles.heading}>
            Profilbild wählen
          </ThemedText>
          <AvatarGrid
            selected={currentEmoji}
            onSelect={(emoji) => {
              updateProfileAvatar(emoji);
              router.back();
            }}
          />
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
});
