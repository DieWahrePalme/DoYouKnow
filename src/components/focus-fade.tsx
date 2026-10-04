import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const FADE_MS = 200;

interface FocusFadeProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Fades a tab screen in when it becomes the focused tab. The opacity always
 * heads for the value that matches the current focus state (1 when focused),
 * so an interrupted fast switch can never leave a screen stuck invisible the
 * way the navigator's own fade can.
 */
export function FocusFade({ style, children }: FocusFadeProps) {
  const focused = useIsFocused();
  const opacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0, { duration: FADE_MS, easing: Easing.out(Easing.quad) });
  }, [focused, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
