import SafetyScreen from '@/app/friend/[id]/safety';
import { SeededScreen } from '@/components/design-preview';

export default function Preview() {
  return (
    <SeededScreen>
      <SafetyScreen />
    </SeededScreen>
  );
}
