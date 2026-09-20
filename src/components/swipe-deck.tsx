import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { AnswerButtons } from '@/components/answer-buttons';
import { SwipeCard, SwipeCardHandle } from '@/components/swipe-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { AnswerMap, AnswerValue, Question } from '@/types';

interface SwipeDeckProps {
  questions: Question[];
  onComplete: (answers: AnswerMap) => void;
}

export function SwipeDeck({ questions, onComplete }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const cardRef = useRef<SwipeCardHandle>(null);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // Static (never dragged) values for the inactive card behind - it's not
  // gesture-enabled, but SwipeCard always needs a pair of shared values.
  const inertTranslateX = useSharedValue(0);
  const inertTranslateY = useSharedValue(0);

  const currentQuestion = questions[index];
  const nextQuestion = questions[index + 1];

  // A fresh question always starts its card centered - the previous
  // question's exit motion must not leak into the next one.
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  function handleAnswer(value: AnswerValue) {
    const updated = { ...answers, [currentQuestion.id]: value };
    setAnswers(updated);
    if (index + 1 >= questions.length) {
      onComplete(updated);
    } else {
      setIndex(index + 1);
    }
  }

  function handleButtonAnswer(value: AnswerValue) {
    cardRef.current?.animateAnswer(value);
  }

  // The card behind scales and slides into place as the active card is
  // dragged away, so the deck feels like a stack advancing rather than a
  // flat swap the instant a question is answered.
  const behindCardStyle = useAnimatedStyle(() => {
    const drag = Math.min(Math.hypot(translateX.value, translateY.value) / 200, 1);
    return {
      opacity: interpolate(drag, [0, 1], [0.55, 1]),
      transform: [
        { scale: interpolate(drag, [0, 1], [0.93, 1]) },
        { translateY: interpolate(drag, [0, 1], [14, 0]) },
      ],
    };
  });

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.progress}>
        Frage {index + 1} von {questions.length}
      </ThemedText>

      <View style={styles.stack}>
        {nextQuestion ? (
          <Animated.View style={[styles.behindCard, behindCardStyle]}>
            <SwipeCard
              question={nextQuestion}
              onAnswer={() => {}}
              active={false}
              translateX={inertTranslateX}
              translateY={inertTranslateY}
            />
          </Animated.View>
        ) : null}
        {currentQuestion ? (
          <SwipeCard
            ref={cardRef}
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
            active
            translateX={translateX}
            translateY={translateY}
          />
        ) : null}
      </View>

      <AnswerButtons onAnswer={handleButtonAnswer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: Spacing.three,
  },
  progress: {
    textAlign: 'center',
  },
  stack: {
    flex: 1,
    marginVertical: Spacing.two,
  },
  behindCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
