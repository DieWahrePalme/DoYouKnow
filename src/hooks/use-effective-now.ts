import { useEffect, useState } from 'react';

import { useAppStore } from '@/state/appStore';

/**
 * The app's current time - but `null` on the very first render, matching
 * what static-export prerendering produces, then a real value right after
 * mount. Any component that displays wall-clock-dependent text (a
 * countdown, "vor 3 Tagen", "heute") must read time through this instead of
 * `Date.now()`/`new Date()` directly, or the static export hydrates with a
 * text mismatch (server prerendered at build time, client mounts later).
 *
 * Re-reads the clock whenever the store's `today` moves past Berlin
 * midnight - it used to freeze at mount time, so a screen left open over
 * midnight kept showing yesterday's cards.
 */
export function useEffectiveNow(): Date | null {
  const today = useAppStore((state) => state.today);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, [today]);

  return now;
}
