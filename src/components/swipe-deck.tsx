import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnswerButtons } from '@/components/answer-buttons';
import { SwipeCard } from '@/components/swipe-card';
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

  const currentQuestion = questions[index];
  const nextQuestion = questions[index + 1];

  function handleAnswer(value: AnswerValue) {
    const updated = { ...answers, [currentQuestion.id]: value };
    setAnswers(updated);
    if (index + 1 >= questions.length) {
      onComplete(updated);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.progress}>
        Frage {index + 1} von {questions.length}
      </ThemedText>

      <View style={styles.stack}>
        {nextQuestion ? (
          <View style={styles.behindCard}>
            <SwipeCard question={nextQuestion} onAnswer={() => {}} active={false} />
          </View>
        ) : null}
        {currentQuestion ? (
          <SwipeCard key={currentQuestion.id} question={currentQuestion} onAnswer={handleAnswer} active />
        ) : null}
      </View>

      <AnswerButtons onAnswer={handleAnswer} />
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
    transform: [{ scale: 0.95 }, { translateY: 10 }],
    opacity: 0.6,
  },
});
