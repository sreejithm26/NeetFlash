export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface SM2Data {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string; // ISO format
}

export interface Flashcard {
  id: string;
  problemId: string;
  title: string;
  front: string;
  back: string;
  sm2Data: SM2Data;
}

export interface Problem {
  id: string;
  problemNumber?: number;
  title: string;
  difficulty: Difficulty;
  pattern: string;
  subPattern?: string;
  description?: string;
  explanation?: string;
  tags: string[];
  companies?: string[];
  url?: string;
  imageUrl?: string;
  patternCode?: string;
  notes?: string;
  drawingStrokes?: any[];
  isFavorite?: boolean;
  addedAt: string;
}

export interface RevisionStats {
  cardsCreated: number;
  problemsSolved: number;
  patternsMastered: number;
  revisionDue: number;
}

export const PATTERNS = [
  'Arrays',
  'Two Pointers',
  'Sliding Window',
  'Hashing',
  'String',
  'Linked List',
  'Stack',
  'Queue',
  'Heap',
  'Binary Search',
  'Tree',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Bit Manipulation',
  'Math',
  'Design',
  'Advanced'
] as const;

export type PatternCategory = typeof PATTERNS[number];
