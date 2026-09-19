import { AnswerMap, DailyDeck, Friend, ME_ID } from '@/types';

/**
 * Question pools are grouped by theme. Each subject (me or a friend) gets ONE
 * theme assigned per day - everybody guessing about that subject answers the
 * exact same 5 questions, but a different subject can have a different theme.
 */
const THEMES: Record<string, string[]> = {
  Urlaub: [
    'Ich würde spontan für ein Wochenende ins Ausland fliegen.',
    'Ich bevorzuge Meer statt Berge.',
    'Ich packe meinen Koffer erst am Abreisetag.',
    'Ich würde lieber campen als im Hotel übernachten.',
    'Ich probiere im Urlaub am liebsten lokales Essen statt Bekanntem.',
  ],
  Sport: [
    'Ich treibe mindestens dreimal die Woche Sport.',
    'Ich würde lieber einen Marathon laufen als Gewichte heben.',
    'Ich schaue mir lieber Sport im Fernsehen an, als ihn selbst zu machen.',
    'Ich würde einem Team-Sport einen Einzelsport vorziehen.',
    'Ich stehe für ein Training früh vor der Arbeit auf.',
  ],
  Essen: [
    'Ich koche lieber selbst, als essen zu gehen.',
    'Ich würde exotisches Essen probieren, ohne vorher zu wissen was drin ist.',
    'Süßes ist mir wichtiger als Herzhaftes.',
    'Ich könnte auf Fleisch komplett verzichten.',
    'Scharfes Essen mag ich richtig gerne.',
  ],
  Freizeit: [
    'Ich verbringe einen freien Abend lieber allein als in Gesellschaft.',
    'Ich würde ein neues Hobby völlig spontan starten.',
    'Ich lese lieber ein Buch als einen Film zu schauen.',
    'Ich bin eher der Morgenmensch als der Nachtmensch.',
    'Ich würde ein ganzes Wochenende ohne Handy verbringen können.',
  ],
  Zukunft: [
    'Ich würde für den perfekten Job in eine andere Stadt ziehen.',
    'Ich habe schon einen konkreten Plan für die nächsten 5 Jahre.',
    'Ich würde lieber mein eigenes Ding starten, als angestellt zu bleiben.',
    'Geld ist mir wichtiger als viel Freizeit.',
    'Ich könnte mir vorstellen, für immer an einem Ort zu bleiben.',
  ],
};

function buildDeck(id: string, theme: string): DailyDeck {
  return {
    id,
    theme,
    questions: THEMES[theme].map((text, index) => ({
      id: `${id}-q${index + 1}`,
      text,
    })),
  };
}

/** Today's deck per subject id (`me` plus every friend). */
export const DECKS_BY_SUBJECT: Record<string, DailyDeck> = {
  [ME_ID]: buildDeck('deck-me', 'Freizeit'),
  'lena': buildDeck('deck-lena', 'Urlaub'),
  'tom': buildDeck('deck-tom', 'Sport'),
  'sara': buildDeck('deck-sara', 'Essen'),
  'mia': buildDeck('deck-mia', 'Zukunft'),
};

export const FRIENDS: Friend[] = [
  { id: 'lena', name: 'Lena', avatarEmoji: '🦊', streak: 12 },
  { id: 'tom', name: 'Tom', avatarEmoji: '🐨', streak: 5 },
  { id: 'sara', name: 'Sara', avatarEmoji: '🐢', streak: 0 },
  { id: 'mia', name: 'Mia', avatarEmoji: '🐝', streak: 3 },
];

/**
 * Self-answers that already exist at app start, i.e. the subject already
 * told the truth about themselves today. `me` starts unanswered on purpose so
 * you can see friends "waiting" for you get unlocked once you answer.
 */
export const INITIAL_SELF_ANSWERS: Record<string, AnswerMap> = {
  tom: {
    'deck-tom-q1': 'yes',
    'deck-tom-q2': 'leanYes',
    'deck-tom-q3': 'no',
    'deck-tom-q4': 'leanNo',
    'deck-tom-q5': 'yes',
  },
};

/**
 * Guesses friends already made about `me` today, before I answered my own
 * questions. Once I submit my self-answers these resolve automatically.
 */
export const INITIAL_GUESSES_ABOUT_ME: Record<string, AnswerMap> = {
  lena: {
    'deck-me-q1': 'leanYes',
    'deck-me-q2': 'yes',
    'deck-me-q3': 'no',
    'deck-me-q4': 'leanNo',
    'deck-me-q5': 'yes',
  },
};
