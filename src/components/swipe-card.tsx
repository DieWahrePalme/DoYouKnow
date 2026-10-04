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
import { FontFamily, Radius, Spacing } from '@/constants/theme';
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

  // Runs on the UI thread when called from the pan gesture's onEnd, so it
  // must be a worklet - a plain JS function there crashes the app natively
  // on iOS/Android (web runs gestures on the JS thread and never noticed).
  function finish(value: AnswerValue, exitX: number, exitY: number, velocityX = 0, velocityY = 0) {
    'worklet';
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

  const dragMagnitude = (tx: number, ty: number) => {
    'worklet';
    return Math.min(Math.hypot(tx, ty) / 220, 1);
  };

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
      <Animated.View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, cardStyle]}>
        <Animated.View style={[styles.stamp, styles.stampRight, styles.stampYes, yesStampStyle]}>
          <ThemedText style={styles.stampText}>JA</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampLeft, styles.stampNo, noStampStyle]}>
          <ThemedText style={styles.stampText}>NEIN</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampTop, styles.stampYes, leanYesStampStyle]}>
          <ThemedText style={styles.stampText}>EHER JA</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampBottom, styles.stampNo, leanNoStampStyle]}>
          <ThemedText style={styles.stampText}>EHER NEIN</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampCenter, styles.stampNever, neverStampStyle]} pointerEvents="none">
          <ThemedText style={[styles.stampText, { color: '#FFFFFF' }]}>NIE</ThemedText>
        </Animated.View>

        <View style={styles.questionWrap}>
          <ThemedText style={styles.questionText}>{question.text}</ThemedText>
        </View>
        <View style={[styles.hintPill, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Nie · 2× tippen
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
    borderRadius: Radius.card + 4,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  questionWrap: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  questionText: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
    textAlign: 'center',
    color: '#F5F5F7',
  },
  hintPill: {
    position: 'absolute',
    bottom: Spacing.four,
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  stamp: {
    position: 'absolute',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  stampText: {
    fontFamily: FontFamily.display,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.4,
    color: '#07070B',
  },
  stampYes: { backgroundColor: '#3DDC97' },
  stampNo: { backgroundColor: '#FF5470' },
  stampNever: { backgroundColor: '#B3243F' },
  stampRight: { top: Spacing.four, right: Spacing.four },
  stampLeft: { top: Spacing.four, left: Spacing.four },
  stampTop: { top: Spacing.four, alignSelf: 'center' },
  stampBottom: { bottom: 72, alignSelf: 'center' },
  stampCenter: { top: '45%', alignSelf: 'center' },
});
