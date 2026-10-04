import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

/** Upper bound on the wait: if an animation never reports "done", content shows anyway. */
const MAX_WAIT_MS = 350;

/**
 * False on the first render, true once the current transition/animation has
 * finished (or after MAX_WAIT_MS at the latest). Lets a screen paint its
 * frame first and mount heavy content after.
 */
export function useAfterInteractions(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => setReady(true));
    const fallback = setTimeout(() => setReady(true), MAX_WAIT_MS);
    return () => {
      handle.cancel();
      clearTimeout(fallback);
    };
  }, []);

  return ready;
}
