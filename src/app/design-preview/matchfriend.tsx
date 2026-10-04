import MatchFriendScreen from '@/app/match/[friendId]/index';
import { SeededScreen } from '@/components/design-preview';

export default function Preview() {
  return (
    <SeededScreen>
      <MatchFriendScreen />
    </SeededScreen>
  );
}
