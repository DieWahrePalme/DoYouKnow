import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AnswerValue, Question } from '@/types';

const SWIPE_THRESHOLD = 90;
const EXIT_DISTANCE = 600;

interface SwipeCardProps {
  question: Question;
  onAnswer: (value: AnswerValue) => void;
  active: boolean;
}

export function SwipeCard({ question, onAnswer, active }: SwipeCardProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  function finish(value: AnswerValue, exitX: number, exitY: number) {
    translateX.value = withTiming(exitX, { duration: 180 });
    translateY.value = withTiming(exitY, { duration: 180 }, (finished) => {
      if (finished) runOnJS(onAnswer)(value);
    });
  }

  const pan = Gesture.Pan()
    .enabled(active)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const dx = e.translationX;
      const dy = e.translationY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > absY && absX > SWIPE_THRESHOLD) {
        finish(dx > 0 ? 'always' : 'never', dx > 0 ? EXIT_DISTANCE : -EXIT_DISTANCE, dy);
        return;
      }
      if (absY >= absX && absY > SWIPE_THRESHOLD) {
        finish(dy < 0 ? 'often' : 'sometimes', dx, dy < 0 ? -EXIT_DISTANCE : EXIT_DISTANCE);
        return;
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-300, 300], [-10, 10])}deg` },
    ],
  }));

  const alwaysStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));
  const neverStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));
  const oftenStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));
  const sometimesStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, { backgroundColor: theme.backgroundElement }, cardStyle]}>
        <Animated.View style={[styles.stamp, styles.stampRight, alwaysStampStyle]}>
          <ThemedText type="title" style={styles.stampTextAlways}>
            IMMER
          </ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampLeft, neverStampStyle]}>
          <ThemedText type="title" style={styles.stampTextNever}>
            NIE
          </ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampTop, oftenStampStyle]}>
          <ThemedText type="subtitle" style={styles.stampTextOften}>
            OFT
          </ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampBottom, sometimesStampStyle]}>
          <ThemedText type="subtitle" style={styles.stampTextSometimes}>
            MANCHMAL
          </ThemedText>
        </Animated.View>

        <View style={styles.questionWrap}>
          <ThemedText type="subtitle" style={styles.questionText}>
            {question.text}
          </ThemedText>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  questionWrap: {
    alignItems: 'center',
  },
  questionText: {
    textAlign: 'center',
  },
  stamp: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  stampRight: {
    top: Spacing.four,
    right: Spacing.four,
    transform: [{ rotate: '12deg' }],
    borderColor: '#34C759',
  },
  stampLeft: {
    top: Spacing.four,
    left: Spacing.four,
    transform: [{ rotate: '-12deg' }],
    borderColor: '#FF3B30',
  },
  stampTop: {
    top: Spacing.four,
    alignSelf: 'center',
    borderColor: '#34C759',
  },
  stampBottom: {
    bottom: Spacing.four,
    alignSelf: 'center',
    borderColor: '#FF3B30',
  },
  stampTextAlways: {
    color: '#34C759',
  },
  stampTextNever: {
    color: '#FF3B30',
  },
  stampTextOften: {
    color: '#34C759',
  },
  stampTextSometimes: {
    color: '#FF3B30',
  },
});
