import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { AnswerButtons } from '@/components/answer-buttons';
import { SwipeCard, SwipeCardHandle } from '@/components/swipe-card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AnswerMap, AnswerValue, Question } from '@/types';

interface SwipeDeckProps {
  questions: Question[];
  onComplete: (answers: AnswerMap) => void;
}

export function SwipeDeck({ questions, onComplete }: SwipeDeckProps) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const cardRef = useRef<SwipeCardHandle>(null);
  // Written by whichever card is on top, read by the one behind it.
  const dragProgress = useSharedValue(0);

  function handleAnswer(value: AnswerValue) {
    const updated = { ...answers, [questions[index].id]: value };
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

  // Only the top card and the one behind it exist. Cards are keyed by
  // question id, so the card behind is promoted in place (no remount).
  const visible = questions.slice(index, index + 2);

  return (
    <View style={styles.wrap}>
      <View style={styles.progress} accessibilityLabel={`Frage ${index + 1} von ${questions.length}`}>
        {questions.map((question, i) => (
          <View
            key={question.id}
            style={[styles.segment, { backgroundColor: i <= index ? theme.primary : theme.backgroundSelected }]}
          />
        ))}
      </View>

      <View style={styles.stack}>
        {visible.map((question) => {
          const isTop = question.id === questions[index].id;
          return (
            <SwipeCard
              ref={isTop ? cardRef : undefined}
              key={question.id}
              question={question}
              onAnswer={handleAnswer}
              active={isTop}
              dragProgress={dragProgress}
            />
          );
        })}
      </View>

      <AnswerButtons onAnswer={handleButtonAnswer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: Spacing.four,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: Radius.pill,
  },
  stack: {
    flex: 1,
    marginVertical: Spacing.two,
  },
});
