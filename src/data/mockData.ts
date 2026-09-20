import { AnswerMap, AnswerValue, Friend, HistoryMap, Profile, QuestionGroup } from '@/types';

const GROUP_DEFS: { id: string; name: string; icon: string; questions: string[] }[] = [
  {
    id: 'urlaub',
    name: 'Urlaub',
    icon: '🏖️',
    questions: [
      'Ich würde spontan für ein Wochenende ins Ausland fliegen.',
      'Ich bevorzuge Meer statt Berge.',
      'Ich würde lieber campen als im Hotel übernachten.',
      'Ich packe meinen Koffer erst am Abreisetag.',
      'Ich probiere im Urlaub am liebsten lokales Essen statt Bekanntem.',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    icon: '🏃',
    questions: [
      'Ich treibe mindestens dreimal die Woche Sport.',
      'Ich würde lieber einen Marathon laufen als Gewichte heben.',
      'Ich schaue mir lieber Sport im Fernsehen an, als ihn selbst zu machen.',
      'Ich würde einem Team-Sport einen Einzelsport vorziehen.',
      'Ich stehe für ein Training früh vor der Arbeit auf.',
    ],
  },
  {
    id: 'essen',
    name: 'Essen',
    icon: '🍔',
    questions: [
      'Ich koche lieber selbst, als essen zu gehen.',
      'Ich würde exotisches Essen probieren, ohne vorher zu wissen was drin ist.',
      'Süßes ist mir wichtiger als Herzhaftes.',
      'Ich könnte auf Fleisch komplett verzichten.',
      'Scharfes Essen mag ich richtig gerne.',
    ],
  },
  {
    id: 'freizeit',
    name: 'Freizeit',
    icon: '🎮',
    questions: [
      'Ich verbringe einen freien Abend lieber allein als in Gesellschaft.',
      'Ich würde ein neues Hobby völlig spontan starten.',
      'Ich lese lieber ein Buch als einen Film zu schauen.',
      'Ich bin eher der Morgenmensch als der Nachtmensch.',
      'Ich würde ein ganzes Wochenende ohne Handy verbringen können.',
    ],
  },
  {
    id: 'zukunft',
    name: 'Zukunft & Familie',
    icon: '🔮',
    questions: [
      'Ich könnte mir vorstellen, bald eine Familie zu gründen.',
      'Ich habe schon einen konkreten Plan für die nächsten 5 Jahre.',
      'Ich würde lieber mein eigenes Ding starten, als angestellt zu bleiben.',
      'Geld ist mir wichtiger als viel Freizeit.',
      'Ich könnte mir vorstellen, für immer an einem Ort zu bleiben.',
    ],
  },
];

/** The shared catalog of topics. Every person answers into the same groups independently. */
export const QUESTION_GROUPS: QuestionGroup[] = GROUP_DEFS.map((group) => ({
  id: group.id,
  name: group.name,
  icon: group.icon,
  questions: group.questions.map((text, index) => ({ id: `${group.id}-q${index + 1}`, text })),
}));

export const FRIENDS: Friend[] = [
  { id: 'lena', name: 'Lena', avatarEmoji: '🦊', streak: 12 },
  { id: 'tom', name: 'Tom', avatarEmoji: '🐨', streak: 5 },
  { id: 'sara', name: 'Sara', avatarEmoji: '🐢', streak: 0 },
  { id: 'mia', name: 'Mia', avatarEmoji: '🐝', streak: 3 },
];

export const DEFAULT_PROFILE: Profile = {
  name: 'Du',
  avatarEmoji: '🙂',
};

export const AVATAR_CHOICES = ['🙂', '😎', '🦊', '🐨', '🐢', '🐝', '🐼', '🦁', '🐧', '🦄', '🐙', '🌵'];

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function round(questionIds: string[], values: AnswerValue[], at: string): HistoryMap {
  const map: HistoryMap = {};
  questionIds.forEach((id, i) => {
    map[id] = [{ value: values[i], at }];
  });
  return map;
}

function mergeRounds(...rounds: HistoryMap[]): HistoryMap {
  const merged: HistoryMap = {};
  for (const round_ of rounds) {
    for (const [questionId, entries] of Object.entries(round_)) {
      merged[questionId] = [...(merged[questionId] ?? []), ...entries];
    }
  }
  return merged;
}

const urlaubIds = QUESTION_GROUPS.find((g) => g.id === 'urlaub')!.questions.map((q) => q.id);
const sportIds = QUESTION_GROUPS.find((g) => g.id === 'sport')!.questions.map((q) => q.id);

/**
 * subjectId -> groupId -> HistoryMap. A missing group means "never answered
 * yet". Each completed round through a group's 5 questions adds one new,
 * timestamped entry per question - nothing is ever overwritten.
 */
export const INITIAL_HISTORY: Record<string, Record<string, HistoryMap>> = {
  me: {
    // Demonstrates exactly the "changed my mind over the year" use case:
    // question 3 ("lieber campen") went nie -> oft -> (answer again to see it become "immer").
    urlaub: mergeRounds(
      round(urlaubIds, ['never', 'never', 'never', 'always', 'often'], monthsAgo(12)),
      round(urlaubIds, ['sometimes', 'never', 'often', 'always', 'always'], monthsAgo(3)),
    ),
  },
  tom: {
    sport: round(sportIds, ['always', 'often', 'never', 'sometimes', 'always'], daysAgo(2)),
  },
  lena: {
    // High overlap with "me" on Urlaub - shows up as a strong Match.
    urlaub: round(urlaubIds, ['sometimes', 'never', 'often', 'always', 'sometimes'], daysAgo(5)),
  },
  mia: {
    // Mostly different from "me" on Urlaub - shows up as a weak Match.
    urlaub: round(urlaubIds, ['always', 'always', 'never', 'never', 'never'], daysAgo(10)),
  },
};

/** Guesses a friend already made about me, keyed by friend id -> group id -> answers. */
export const INITIAL_GUESSES_ABOUT_ME: Record<string, Record<string, AnswerMap>> = {
  lena: {
    freizeit: {
      'freizeit-q1': 'often',
      'freizeit-q2': 'always',
      'freizeit-q3': 'never',
      'freizeit-q4': 'sometimes',
      'freizeit-q5': 'always',
    },
  },
};
