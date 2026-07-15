import type { SM2Data } from '../types';

/**
 * SuperMemo-2 (SM-2) Algorithm Implementation
 * 
 * Quality responses:
 * 0: Complete blackout.
 * 1: Incorrect response; the correct one remembered.
 * 2: Incorrect response; where the correct one seemed easy to recall.
 * 3: Correct response recalled with serious difficulty.
 * 4: Correct response after a hesitation.
 * 5: Perfect response.
 * 
 * Mapping for UI:
 * Again = 1
 * Hard = 3
 * Good = 4
 * Easy = 5
 */

export const INITIAL_SM2_DATA: SM2Data = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReviewDate: new Date().toISOString(),
};

export function calculateSM2(
  quality: number,
  previousData: SM2Data
): SM2Data {
  let { easeFactor, interval, repetitions } = previousData;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}
