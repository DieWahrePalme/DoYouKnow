import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
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
  const neverPulse = useSharedValue(0);

  function finish(value: AnswerValue, exitX: number, exitY: number) {
    translateX.value = withTiming(exitX, { duration: 180 });
    translateY.value = withTiming(exitY, { duration: 180 }, (finished) => {
      if (finished) runOnJS(onAnswer)(value);
    });
  }

  function answerNever() {
    onAnswer('never');
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
        finish(dx > 0 ? 'yes' : 'no', dx > 0 ? EXIT_DISTANCE : -EXIT_DISTANCE, dy);
        return;
      }
      if (absY >= absX && absY > SWIPE_THRESHOLD) {
        finish(dy < 0 ? 'leanYes' : 'leanNo', dx, dy < 0 ? -EXIT_DISTANCE : EXIT_DISTANCE);
        return;
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  // A hard "Nie" is a deliberate double-tap on the card, not a swipe. Race
  // (not Exclusive) is what keeps swiping instant: Exclusive made every
  // touch wait out the double-tap timeout before a drag was even allowed to
  // start, which is exactly the lag/"hängt" the double-tap change caused.
  // With Race, Pan simply wins the moment real movement happens, while a
  // still finger gives the tap gesture room to recognize two quick taps.
  const doubleTap = Gesture.Tap()
    .enabled(active)
    .numberOfTaps(2)
    .maxDistance(15)
    .onStart(() => {
      neverPulse.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 220 }, (finished) => {
          if (finished) runOnJS(answerNever)();
        }),
      );
    });

  const gesture = Gesture.Race(pan, doubleTap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-300, 300], [-10, 10])}deg` },
    ],
  }));

  const yesStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));
  const noStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));
  const leanYesStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));
  const leanNoStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));
  const neverStampStyle = useAnimatedStyle(() => ({
    opacity: neverPulse.value,
    transform: [{ scale: interpolate(neverPulse.value, [0, 1], [0.7, 1.15]) }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, { backgroundColor: theme.backgroundElement }, cardStyle]}>
        <Animated.View style={[styles.stamp, styles.stampRight, yesStampStyle]}>
          <ThemedText type="title" style={styles.stampTextYes}>
            JA
          </ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampLeft, noStampStyle]}>
          <ThemedText type="title" style={styles.stampTextNo}>
            NEIN
          </ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampTop, leanYesStampStyle]}>
          <ThemedText type="subtitle" style={styles.stampTextLeanYes}>
            EHER JA
          </ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampBottom, leanNoStampStyle]}>
          <ThemedText type="subtitle" style={styles.stampTextLeanNo}>
            EHER NEIN
          </ThemedText>
        </Animated.View>
        <Animated.View style={[styles.neverStamp, neverStampStyle]} pointerEvents="none">
          <ThemedText type="title" style={styles.stampTextNever}>
            NIE
          </ThemedText>
        </Animated.View>

        <View style={styles.questionWrap}>
          <ThemedText type="subtitle" style={styles.questionText}>
            {question.text}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Nie (2× tippen)
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
    gap: Spacing.two,
  },
  questionText: {
    textAlign: 'center',
  },
  hint: {
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
  neverStamp: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -70,
    marginTop: -30,
    width: 140,
    borderWidth: 4,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderColor: '#8E1B1B',
  },
  stampTextYes: {
    color: '#34C759',
  },
  stampTextNo: {
    color: '#FF3B30',
  },
  stampTextLeanYes: {
    color: '#34C759',
  },
  stampTextLeanNo: {
    color: '#FF3B30',
  },
  stampTextNever: {
    color: '#8E1B1B',
  },
});
