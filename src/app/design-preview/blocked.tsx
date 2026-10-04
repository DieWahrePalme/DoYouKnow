import BlockedScreen from '@/app/settings/blocked';
import { SeededScreen } from '@/components/design-preview';

export default function Preview() {
  return (
    <SeededScreen>
      <BlockedScreen />
    </SeededScreen>
  );
}
