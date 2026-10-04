import * as Haptics from 'expo-haptics';
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
import { ANSWER_LABELS, AnswerValue, Question } from '@/types';

/** VoiceOver users answer through these custom actions (or the buttons below) instead of swiping. */
const ACCESSIBILITY_ANSWERS: AnswerValue[] = ['yes', 'leanYes', 'leanNo', 'no', 'never'];

const SWIPE_THRESHOLD = 90;
const EXIT_DISTANCE = 700;
/** Velocity (px/s) at which a short flick still counts as a swipe. */
const FLICK_VELOCITY = 800;
/** Floor for the exit speed (px/s); keeps even a slow drag from crawling off. */
const MIN_EXIT_SPEED = 900;
/** The exit never takes less/more than this, so a throw reads as a motion, not a cut. */
const MIN_EXIT_MS = 380;
const MAX_EXIT_MS = 560;
/** Drag distance (px) after which the card behind has fully moved up into place. */
const BEHIND_FULL_AT = 200;
/** How each layer further back sits: pushed down, smaller, dimmer (index = layers back, 0 = top). */
const LAYER_OFFSET_Y = 20;
const LAYER_SHRINK = 0.05;
/** How dark the veil over each layer is (cards stay opaque so text never shows through). */
const LAYER_SHADE = [0, 0.25, 0.5, 0.72];

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
  /** The top card takes gestures; the one behind just waits and rises as the top card is dragged away. */
  active: boolean;
  /** This card's position in the whole deck (0 = first question). */
  index: number;
  /**
   * Where the deck currently is, as `topIndex + drag (0-1)`. Written by the top card, read by the
   * ones behind: the value stays continuous when a card is answered and the next becomes the top.
   */
  stackPos: SharedValue<number>;
}

/**
 * Cards keep their identity for their whole life (the deck keys them by
 * question id): the card behind becomes the top card without being recreated,
 * so there is no remount flash when a question is answered.
 */
export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { question, onAnswer, active, index, stackPos },
  ref,
) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const neverPulse = useSharedValue(0);
  // True once the drag has passed the commit threshold, so the tick fires once per crossing.
  const armed = useSharedValue(false);
  const isActive = useSharedValue(active ? 1 : 0);
  // Fades a freshly added back card in, so it doesn't pop in behind the top one.
  const appear = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    isActive.value = active ? 1 : 0;
  }, [active, isActive]);

  useEffect(() => {
    appear.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) });
  }, [appear]);

  function tick() {
    void Haptics.selectionAsync();
  }

  function thud() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Runs on the UI thread when called from the pan gesture's onEnd, so it
  // must be a worklet - a plain JS function there crashes the app natively
  // on iOS/Android (web runs gestures on the JS thread and never noticed).
  function finish(value: AnswerValue, exitX: number, exitY: number, velocityX = 0, velocityY = 0) {
    'worklet';
    const distance = Math.hypot(exitX - translateX.value, exitY - translateY.value);
    const speed = Math.max(Math.hypot(velocityX, velocityY), MIN_EXIT_SPEED);
    const duration = Math.min(MAX_EXIT_MS, Math.max(MIN_EXIT_MS, (distance / speed) * 1000));
    // Leaves with momentum and settles out; the card behind rises over the same time.
    const easing = Easing.bezier(0.25, 0.6, 0.3, 1);

    armed.value = false;
    runOnJS(thud)();
    translateX.value = withTiming(exitX, { duration, easing });
    translateY.value = withTiming(exitY, { duration, easing }, (finished) => {
      if (finished) {
        stackPos.value = index + 1;
        runOnJS(onAnswer)(value);
      }
    });
  }

  function playNever() {
    neverPulse.value = withSequence(
      withTiming(1, { duration: 160 }),
      withTiming(0, { duration: 360 }, (finished) => {
        if (finished) runOnJS(onAnswer)('never');
      }),
    );
  }

  function animateAnswer(value: AnswerValue) {
    if (value === 'never') {
      playNever();
      return;
    }
    const [x, y] = EXIT_TARGETS[value];
    finish(value, x, y);
  }

  useImperativeHandle(ref, () => ({ animateAnswer }));

  const pan = Gesture.Pan()
    .enabled(active)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      const past = Math.hypot(e.translationX, e.translationY) > SWIPE_THRESHOLD;
      if (past !== armed.value) {
        armed.value = past;
        if (past) runOnJS(tick)();
      }
    })
    .onEnd((e) => {
      const dx = e.translationX;
      const dy = e.translationY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      // A confident flick clears the deck even if it hasn't crossed the
      // distance threshold yet - matches how a real swipe gesture feels.
      const fastX = Math.abs(e.velocityX) > FLICK_VELOCITY;
      const fastY = Math.abs(e.velocityY) > FLICK_VELOCITY;

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
      armed.value = false;
      translateX.value = withSpring(0, { damping: 18, stiffness: 240, mass: 0.8, velocity: e.velocityX });
      translateY.value = withSpring(0, { damping: 18, stiffness: 240, mass: 0.8, velocity: e.velocityY });
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

  const cardStyle = useAnimatedStyle(() => {
    const travelled = Math.hypot(translateX.value, translateY.value);
    // The top card reports its drag so the layers behind rise with it. Done here (not in a
    // reaction) because this style is guaranteed to re-run on every frame the card moves.
    if (isActive.value) stackPos.value = index + Math.min(travelled / BEHIND_FULL_AT, 1);
    // Layers back from the top (0 = on top). Continuous while the top card is dragged away.
    const layer = Math.max(index - stackPos.value, 0);
    return {
      opacity: appear.value * interpolate(travelled, [420, 700], [1, 0], 'clamp'),
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + layer * LAYER_OFFSET_Y },
        // Keeps rotating while it flies out, which sells the throw.
        { rotate: `${interpolate(translateX.value, [-320, 320], [-14, 14])}deg` },
        { scale: 1 - layer * LAYER_SHRINK },
      ],
    };
  });

  const shadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.max(index - stackPos.value, 0), [0, 1, 2, 3], LAYER_SHADE, 'clamp'),
  }));

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
      <Animated.View
        // Only the top card is exposed to VoiceOver; the layers behind it are decoration.
        accessible={active}
        accessibilityElementsHidden={!active}
        aria-hidden={!active}
        importantForAccessibility={active ? 'yes' : 'no-hide-descendants'}
        accessibilityLabel={question.text}
        accessibilityHint="Mit Hoch- und Runterwischen eine Antwort wählen und doppeltippen, oder die Antwort-Buttons unter der Karte nutzen."
        accessibilityActions={ACCESSIBILITY_ANSWERS.map((value) => ({ name: value, label: ANSWER_LABELS[value] }))}
        onAccessibilityAction={(event) => {
          const value = event.nativeEvent.actionName as AnswerValue;
          if (ACCESSIBILITY_ANSWERS.includes(value)) animateAnswer(value);
        }}
        style={[
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border, zIndex: active ? 2 : 1 },
          cardStyle,
        ]}>
        <Animated.View style={[styles.stamp, styles.stampRight, styles.stampYes, yesStampStyle]}>
          <ThemedText style={styles.stampText} maxFontSizeMultiplier={1.2}>JA</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampLeft, styles.stampNo, noStampStyle]}>
          <ThemedText style={styles.stampText} maxFontSizeMultiplier={1.2}>NEIN</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampTop, styles.stampYes, leanYesStampStyle]}>
          <ThemedText style={styles.stampText} maxFontSizeMultiplier={1.2}>EHER JA</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampBottom, styles.stampNo, leanNoStampStyle]}>
          <ThemedText style={styles.stampText} maxFontSizeMultiplier={1.2}>EHER NEIN</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampCenter, styles.stampNever, neverStampStyle]} pointerEvents="none">
          <ThemedText style={[styles.stampText, { color: '#FFFFFF' }]}>NIE</ThemedText>
        </Animated.View>

        <View style={styles.questionWrap}>
          <ThemedText style={styles.questionText} adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={7}>
            {question.text}
          </ThemedText>
        </View>
        <View style={[styles.hintPill, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint} maxFontSizeMultiplier={1.3}>
            Nie · 2× tippen
          </ThemedText>
        </View>
        <Animated.View style={[styles.shade, shadeStyle]} pointerEvents="none" />
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
    paddingHorizontal: Spacing.four,
    paddingVertical: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  shade: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: Radius.card + 4,
    backgroundColor: '#07070B',
  },
  questionWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  questionText: {
    fontFamily: FontFamily.display,
    fontSize: 42,
    lineHeight: 47,
    letterSpacing: -1.2,
    textAlign: 'center',
    color: '#F5F5F7',
  },
  hintPill: {
    position: 'absolute',
    bottom: Spacing.three,
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
