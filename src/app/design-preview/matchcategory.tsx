import MatchCategoryScreen from '@/app/match/[friendId]/[categoryId]';
import { SeededScreen } from '@/components/design-preview';

export default function Preview() {
  return (
    <SeededScreen>
      <MatchCategoryScreen />
    </SeededScreen>
  );
}
