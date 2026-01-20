export interface Card {
  id: string;
  deckId: string;
  generic: string;
  brand: string;
  notes: string;
  tags: string[];
  
  // Persistent Stats
  difficultyScore: number; // Increments on Again/Hard, used for leech weighting
  
  // SRS Fields (Legacy support, but primarily using session scheduler now)
  dueDate: number; 
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  
  createdAt: number;
  updatedAt: number;
}

export interface Deck {
  id: string;
  name: string;
  createdAt: number;
}

export enum Grade {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4
}

export interface AppSettings {
  darkMode: boolean;
  learningSteps: number[];
  newCardsPerDay: number;
  reviewsPerDay: number;
  initialEaseFactor: number;
  easyBonus: number;
}

export type StudyMode = 'generic_to_brand' | 'brand_to_generic' | 'mixed';

export interface ReviewLog {
  cardId: string;
  grade: Grade;
  studiedAt: number;
}

// Ephemeral Session State per Card
export interface SessionCard extends Card {
  sessionState: 'unseen' | 'active' | 'easyPool';
  sessionDueTime: number; // Timestamp when it can be shown again
  sessionConfident: boolean;
  sessionGoodStreak: number;
  lastShownAt: number;
}

export interface ParseResult {
  generic: string;
  brand: string;
}