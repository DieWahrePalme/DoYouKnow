import { useEffect, useState } from 'react';

import { useAppStore } from '@/state/appStore';

/**
 * The app's current time - but `null` on the very first render, matching
 * what static-export prerendering produces, then a real value right after
 * mount. Any component that displays wall-clock-dependent text (a
 * countdown, "vor 3 Tagen", "heute") must read time through this instead of
 * `Date.now()`/`new Date()` directly, or the static export hydrates with a
 * text mismatch (server prerendered at build time, client mounts later).
 */
export function useEffectiveNow(): Date | null {
  const timeOffsetMs = useAppStore((state) => state.timeOffsetMs);
  const [mountedAtMs, setMountedAtMs] = useState<number | null>(null);

  useEffect(() => {
    setMountedAtMs(Date.now());
  }, []);

  if (mountedAtMs === null) return null;
  return new Date(mountedAtMs + timeOffsetMs);
}
