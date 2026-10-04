import { ReactNode, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { AnswerButtons } from '@/components/answer-buttons';
import { SwipeCard, SwipeCardHandle } from '@/components/swipe-card';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AnswerMap, AnswerValue, Question } from '@/types';

interface SwipeDeckProps {
  questions: Question[];
  onComplete: (answers: AnswerMap) => void;
  /** Compact header (avatar + title); the "N übrig" counter sits at its right. */
  header?: ReactNode;
}

/** How many cards are visible as a stack at once (top card + the layers behind it). */
const VISIBLE_LAYERS = 4;

export function SwipeDeck({ questions, onComplete, header }: SwipeDeckProps) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const cardRef = useRef<SwipeCardHandle>(null);
  // `topIndex + drag`, written by the top card, read by the layers behind it.
  const stackPos = useSharedValue(0);

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

  // Cards are keyed by question id, so each one is promoted in place (no remount).
  // Rendered back to front so the top card is last (and on top).
  const visible = questions.slice(index, index + VISIBLE_LAYERS);
  const remaining = questions.length - index;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerSlot}>{header}</View>
        <View
          style={[styles.counter, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          accessibilityLabel={`Noch ${remaining} von ${questions.length} Karten`}>
          <ThemedText style={styles.counterNumber}>{remaining}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.counterLabel}>
            übrig
          </ThemedText>
        </View>
      </View>

      <View style={styles.stack}>
        {[...visible].reverse().map((question) => {
          const cardIndex = questions.indexOf(question);
          const isTop = cardIndex === index;
          return (
            <SwipeCard
              ref={isTop ? cardRef : undefined}
              key={question.id}
              question={question}
              onAnswer={handleAnswer}
              active={isTop}
              index={cardIndex}
              stackPos={stackPos}
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
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerSlot: {
    flex: 1,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  counterNumber: {
    fontFamily: FontFamily.display,
    fontSize: 20,
    lineHeight: 24,
    color: '#F5F5F7',
  },
  counterLabel: {
    fontSize: 13,
  },
  // Room below the card for the layers peeking out underneath it.
  stack: {
    flex: 1,
    marginBottom: 44,
  },
});
