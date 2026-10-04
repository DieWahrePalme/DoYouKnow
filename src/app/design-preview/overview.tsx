import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';

import MyGroupScreen from '@/app/group/[groupId]';
import { useSeededAnswers } from '@/components/design-preview';

/** Dev-only: the answered-card overview with fake answers and a friend guess. */
export default function OverviewPreview() {
  const groupId = useSeededAnswers();
  const router = useRouter();

  useEffect(() => {
    if (groupId) router.setParams({ groupId });
  }, [groupId, router]);

  if (!__DEV__) return <Redirect href="/" />;
  if (!groupId) return null;
  return <MyGroupScreen />;
}
