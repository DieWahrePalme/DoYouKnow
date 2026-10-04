import SettingsScreen from '@/app/settings/index';
import { SeededScreen } from '@/components/design-preview';

export default function Preview() {
  return (
    <SeededScreen>
      <SettingsScreen />
    </SeededScreen>
  );
}
