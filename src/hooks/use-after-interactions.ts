import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

/**
 * False on the first render, true once the current transition/animation has
 * finished. Lets a screen paint its frame first and mount heavy content after.
 */
export function useAfterInteractions(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => handle.cancel();
  }, []);

  return ready;
}
