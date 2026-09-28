import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SwipeDeck } from '@/components/swipe-deck';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Question } from '@/types';

/** Answers in the demo are thrown away - it only teaches the swipe gestures. */
const DEMO_QUESTIONS: Question[] = [
  { id: 'demo1', text: 'Ich esse Pizza lieber mit Ananas.' },
  { id: 'demo2', text: 'Ich stehe gerne früh auf.' },
  { id: 'demo3', text: 'Ich würde gerne einmal Fallschirmspringen.' },
];

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🃏',
    title: 'Jeden Tag eine Karte über dich',
    body: '5 ehrliche Fragen zu einem Thema. Du beantwortest sie für dich – das ist deine Wahrheit.',
  },
  {
    emoji: '👆',
    title: 'Probier’s aus!',
    body: 'Rechts = Ja · Links = Nein · Hoch = Eher ja · Runter = Eher nein · 2× tippen = Nie',
  },
  {
    emoji: '🔥',
    title: 'Wie gut kennen dich deine Freunde?',
    body:
      'Deine Freunde raten deine Karte, du ihre. Danach seht ihr, wer wen am besten kennt – ' +
      'und wenn ihr beide jeden Tag spielt, wächst eure Flamme.',
  },
];

const DEMO_SLIDE = 1;

export default function IntroScreen() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [demoDone, setDemoDone] = useState(false);
  // Remounts the demo deck for "nochmal" without any leftover animation state.
  const [demoRound, setDemoRound] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function next() {
    if (isLast) router.replace('/(auth)/register');
    else setIndex(index + 1);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRow}>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View
                key={s.title}
                style={[styles.dot, { backgroundColor: i === index ? theme.primary : theme.backgroundSelected }]}
              />
            ))}
          </View>
          {!isLast ? (
            <Pressable onPress={() => router.replace('/(auth)/register')} accessibilityRole="button" hitSlop={8}>
              <ThemedText type="small" themeColor="textSecondary">
                Überspringen
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.textBlock}>
          <ThemedText style={styles.emoji}>{slide.emoji}</ThemedText>
          <ThemedText type="subtitle" style={styles.center}>
            {slide.title}
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.center}>
            {slide.body}
          </ThemedText>
        </View>

        <View style={styles.stage}>
          {index === DEMO_SLIDE ? (
            demoDone ? (
              <View style={styles.demoDone}>
                <ThemedText style={styles.emoji}>✅</ThemedText>
                <ThemedText type="subtitle" style={styles.center}>
                  Genau so!
                </ThemedText>
                <Pressable
                  onPress={() => {
                    setDemoDone(false);
                    setDemoRound(demoRound + 1);
                  }}
                  accessibilityRole="button">
                  <ThemedText type="small" themeColor="textSecondary">
                    Nochmal ausprobieren
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <SwipeDeck key={demoRound} questions={DEMO_QUESTIONS} onComplete={() => setDemoDone(true)} />
            )
          ) : null}
        </View>

        <PrimaryButton label={isLast ? 'Konto erstellen' : 'Weiter'} onPress={next} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 60,
  },
  center: {
    textAlign: 'center',
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
  },
  demoDone: {
    alignItems: 'center',
    gap: Spacing.two,
  },
});
