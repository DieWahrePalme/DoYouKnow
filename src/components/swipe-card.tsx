import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
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
const EXIT_DISTANCE = 700;
const EXIT_TARGETS: Record<Exclude<AnswerValue, 'never'>, [number, number]> = {
  yes: [EXIT_DISTANCE, 0],
  no: [-EXIT_DISTANCE, 0],
  leanYes: [0, -EXIT_DISTANCE],
  leanNo: [0, EXIT_DISTANCE],
};

export interface SwipeCardHandle {
  /** Plays the same exit/pulse animation a gesture would, then reports the answer - used by the fallback buttons. */
  animateAnswer: (value: AnswerValue) => void;
}

interface SwipeCardProps {
  question: Question;
  onAnswer: (value: AnswerValue) => void;
  active: boolean;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { question, onAnswer, active, translateX, translateY },
  ref,
) {
  const theme = useTheme();
  const neverPulse = useSharedValue(0);
  const entrance = useSharedValue(0.9);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 14, stiffness: 160 });
    // A freshly mounted card (new question) always starts centered - matches the reset in SwipeDeck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  function finish(value: AnswerValue, exitX: number, exitY: number, velocityX = 0, velocityY = 0) {
    const distance = Math.hypot(exitX - translateX.value, exitY - translateY.value);
    const speed = Math.max(Math.hypot(velocityX, velocityY), 900);
    const duration = Math.min(420, Math.max(180, (distance / speed) * 1000));
    const easing = Easing.out(Easing.cubic);

    translateX.value = withTiming(exitX, { duration, easing });
    translateY.value = withTiming(exitY, { duration, easing }, (finished) => {
      if (finished) runOnJS(onAnswer)(value);
    });
  }

  function playNever() {
    neverPulse.value = withSequence(
      withTiming(1, { duration: 110 }),
      withTiming(0, { duration: 260 }, (finished) => {
        if (finished) runOnJS(onAnswer)('never');
      }),
    );
  }

  useImperativeHandle(ref, () => ({
    animateAnswer(value) {
      if (value === 'never') {
        playNever();
        return;
      }
      const [x, y] = EXIT_TARGETS[value];
      finish(value, x, y);
    },
  }));

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
      // A confident flick clears the deck even if it hasn't crossed the
      // distance threshold yet - matches how a real swipe gesture feels.
      const fastX = Math.abs(e.velocityX) > 900;
      const fastY = Math.abs(e.velocityY) > 900;

      if (absX > absY && (absX > SWIPE_THRESHOLD || fastX)) {
        const goingRight = dx > 0 || (absX <= SWIPE_THRESHOLD && e.velocityX > 0);
        finish(goingRight ? 'yes' : 'no', goingRight ? EXIT_DISTANCE : -EXIT_DISTANCE, dy, e.velocityX, e.velocityY);
        return;
      }
      if (absY >= absX && (absY > SWIPE_THRESHOLD || fastY)) {
        const goingUp = dy < 0 || (absY <= SWIPE_THRESHOLD && e.velocityY < 0);
        finish(goingUp ? 'leanYes' : 'leanNo', dx, goingUp ? -EXIT_DISTANCE : EXIT_DISTANCE, e.velocityX, e.velocityY);
        return;
      }
      translateX.value = withSpring(0, { damping: 16, stiffness: 180, velocity: e.velocityX });
      translateY.value = withSpring(0, { damping: 16, stiffness: 180, velocity: e.velocityY });
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
      runOnJS(playNever)();
    });

  const gesture = Gesture.Race(pan, doubleTap);

  const dragMagnitude = (tx: number, ty: number) => Math.min(Math.hypot(tx, ty) / 220, 1);

  const cardStyle = useAnimatedStyle(() => {
    const drag = dragMagnitude(translateX.value, translateY.value);
    return {
      opacity: entrance.value,
      transform: [
        { scale: interpolate(entrance.value, [0.9, 1], [0.95, 1]) * interpolate(drag, [0, 1], [1, 1.04]) },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${interpolate(translateX.value, [-320, 320], [-14, 14], 'clamp')}deg` },
      ],
    };
  });

  const yesStampStyle = useAnimatedStyle(() => {
    const t = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp');
    return { opacity: t, transform: [{ scale: interpolate(t, [0, 1], [0.75, 1]) }] };
  });
  const noStampStyle = useAnimatedStyle(() => {
    const t = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp');
    return { opacity: t, transform: [{ scale: interpolate(t, [0, 1], [0.75, 1]) }] };
  });
  const leanYesStampStyle = useAnimatedStyle(() => {
    const t = interpolate(translateY.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp');
    return { opacity: t, transform: [{ scale: interpolate(t, [0, 1], [0.75, 1]) }] };
  });
  const leanNoStampStyle = useAnimatedStyle(() => {
    const t = interpolate(translateY.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp');
    return { opacity: t, transform: [{ scale: interpolate(t, [0, 1], [0.75, 1]) }] };
  });
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
});

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
