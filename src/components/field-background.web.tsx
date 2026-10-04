import { useIsFocused, usePathname } from 'expo-router';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions } from 'react-native';

import { FieldVariantName, variantForPath } from '@/constants/field-variants';
import { FieldColors } from '@/constants/theme';

/** Picks the look for the current route; stack screens keep the look of the tab they were opened from. */
function useFieldVariant(): FieldVariantName {
  const pathname = usePathname();
  const last = useRef<FieldVariantName>('home');
  const next = variantForPath(pathname);
  if (next) last.current = next;
  return last.current;
}

const BASE_URL = process.env.EXPO_BASE_URL ?? '';

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** Web variant: CanvasKit (wasm) loads async, the plain dark base shows until it is ready. */
export function FieldBackground() {
  const { width, height } = useWindowDimensions();
  const focused = useIsFocused();
  const variant = useFieldVariant();
  const reduceMotion = useReduceMotion();

  return (
    <View style={[StyleSheet.absoluteFill, styles.base]} pointerEvents="none">
      <WithSkiaWeb
        opts={{ locateFile: (file: string) => `${BASE_URL}/${file}` }}
        getComponent={() => import('@/components/field-canvas')}
        componentProps={{ width, height, paused: !focused || reduceMotion, variant }}
        fallback={null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: FieldColors.base },
});
