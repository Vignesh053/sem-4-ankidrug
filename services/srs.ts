import { Card, Grade, AppSettings } from '../types';
import { MIN_EASE_FACTOR } from '../constants';

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_IN_MINUTE = 60 * 1000;

export const calculateNextReview = (card: Card, grade: Grade, settings: AppSettings): Partial<Card> => {
  const now = Date.now();
  let { intervalDays, easeFactor, repetitions, state, lapses } = card;

  // Grade 1 (Again)
  if (grade === Grade.Again) {
    const firstStep = settings.learningSteps[0] || 1;
    return {
      state: 'learning',
      repetitions: 0,
      lapses: lapses + 1,
      intervalDays: 0,
      dueDate: now + (firstStep * MILLISECONDS_IN_MINUTE),
      easeFactor: Math.max(MIN_EASE_FACTOR, easeFactor - 0.2),
    };
  }

  // Handle Learning / New Phase
  if (state === 'new' || state === 'learning') {
    if (grade >= Grade.Good) {
      // Graduate
      return {
        state: 'review',
        repetitions: 1,
        intervalDays: 1,
        dueDate: now + MILLISECONDS_IN_DAY,
        easeFactor,
      };
    } else if (grade === Grade.Hard) {
      // Repeat step but possibly slightly longer or stay same. 
      // For simplicity in learning, Hard acts like a middle step or repeats current step with penalty.
      // We'll just push it back by the avg of steps or a fixed 5m if steps allow
      const firstStep = settings.learningSteps[0] || 1;
      return {
        state: 'learning',
        dueDate: now + (firstStep * 1.5 * MILLISECONDS_IN_MINUTE), 
      };
    }
    // Again handled above
  }

  // Review Phase (Standard SM-2)
  if (state === 'review') {
    let nextInterval = intervalDays;

    switch (grade) {
      case Grade.Hard:
        nextInterval = intervalDays * 1.2;
        easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
        break;
      case Grade.Good:
        nextInterval = intervalDays * easeFactor;
        // Ease stays same
        break;
      case Grade.Easy:
        nextInterval = intervalDays * easeFactor * settings.easyBonus;
        easeFactor += 0.15;
        break;
    }

    return {
      state: 'review',
      repetitions: repetitions + 1,
      intervalDays: nextInterval,
      dueDate: now + (nextInterval * MILLISECONDS_IN_DAY),
      easeFactor,
    };
  }

  return {}; 
};

export const getSchedulingDescription = (card: Card, grade: Grade, settings: AppSettings): string => {
  const next = calculateNextReview(card, grade, settings);
  if (!next.dueDate) return '?';
  
  const diff = next.dueDate - Date.now();
  
  if (diff < 60 * 60 * 1000) {
    return Math.max(1, Math.round(diff / (60 * 1000))) + 'm';
  } else if (diff < 24 * 60 * 60 * 1000) {
    return Math.round(diff / (60 * 60 * 1000)) + 'h';
  } else {
    return Math.round(diff / (24 * 60 * 60 * 1000)) + 'd';
  }
};
