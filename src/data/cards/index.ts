import { CARDS_1 } from './cards1';
import { CARDS_2 } from './cards2';
import { CARDS_3 } from './cards3';
import { CARDS_4 } from './cards4';
import { CARDS_5 } from './cards5';
import { CARDS_6 } from './cards6';
import { CardDef } from './types';

/**
 * The 300 cards added on top of the original 66 in mockData.ts - together
 * ~a year of daily cards (docs/PRD.md). Card ids must never change once
 * shipped: answers, guesses and guess_days reference them.
 */
export const EXTRA_CARDS: CardDef[] = [...CARDS_1, ...CARDS_2, ...CARDS_3, ...CARDS_4, ...CARDS_5, ...CARDS_6];
