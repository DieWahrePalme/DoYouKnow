/** One topic card: exactly five yes/no-style statements about yourself. */
export interface CardDef {
  id: string;
  name: string;
  icon: string;
  /** A Category id from CATEGORIES in src/data/mockData.ts. */
  category: string;
  questions: [string, string, string, string, string];
}
