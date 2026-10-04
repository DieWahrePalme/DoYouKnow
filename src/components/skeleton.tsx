import { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
}

/** Placeholder block that pulses softly while real content loads (static with Reduce Motion). */
export function Skeleton({ style }: SkeletonProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: 0.45 + pulse.value * 0.4 }));

  return <Animated.View style={[{ backgroundColor: theme.backgroundSelected }, style, animatedStyle]} />;
}
