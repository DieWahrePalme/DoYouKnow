import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, View, useWindowDimensions } from 'react-native';

import FieldCanvas from '@/components/field-canvas';
import { FieldColors } from '@/constants/theme';

/** True while the app is in the foreground. */
function useAppActive() {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/**
 * Full-bleed animated contour field behind the app. Mount once, behind the
 * content. Freezes when the screen isn't focused, the app is backgrounded, or
 * Reduce Motion is on (a frozen frame still shows the contour lines).
 */
export function FieldBackground() {
  const { width, height } = useWindowDimensions();
  const focused = useIsFocused();
  const appActive = useAppActive();
  const reduceMotion = useReduceMotion();

  return (
    <View style={[StyleSheet.absoluteFill, styles.base]} pointerEvents="none">
      <FieldCanvas width={width} height={height} paused={!focused || !appActive || reduceMotion} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: FieldColors.base },
});
