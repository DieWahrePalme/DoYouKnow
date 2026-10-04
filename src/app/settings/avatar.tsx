import { router } from 'expo-router';
import { View } from 'react-native';

import { AvatarGrid } from '@/components/avatar-grid';
import { Screen } from '@/components/screen';
import { useAppStore } from '@/state/appStore';

export default function AvatarSettingsScreen() {
  const currentEmoji = useAppStore((state) => state.users[state.activeUserId]?.avatarEmoji);
  const updateProfileAvatar = useAppStore((state) => state.updateProfileAvatar);

  return (
    <Screen title="Profilbild wählen" subtitle="Tippe auf ein Bild, es wird sofort übernommen.">
      <View>
        <AvatarGrid
          selected={currentEmoji}
          onSelect={(emoji) => {
            updateProfileAvatar(emoji);
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}
