export interface Card {
  id: string;
  deckId: string;
  generic: string;
  brand: string;
  notes: string;
  tags: string[];
  
  // SRS Fields
  dueDate: number; // Timestamp
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

export interface SRSSettings {
  newCardsPerDay: number;
  reviewsPerDay: number;
  learningSteps: number[]; // Minutes, e.g. [1, 10]
  initialEaseFactor: number; // Default 2.5
  easyBonus: number; // Multiplier, e.g. 1.3
}

export interface AppSettings extends SRSSettings {
  darkMode: boolean;
}

export type StudyMode = 'generic_to_brand' | 'brand_to_generic' | 'mixed';

export interface ParseResult {
  generic: string;
  brand: string;
}

export interface ReviewLog {
  cardId: string;
  grade: Grade;
  studiedAt: number;
  previousInterval: number;
  newInterval: number;
}
