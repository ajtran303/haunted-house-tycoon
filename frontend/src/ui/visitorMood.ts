import { EMOTION_BOUNDS } from '../core/constants';
import { FEAR_PANIC_THRESHOLD, HAPPINESS_MISERY_THRESHOLD } from '../core/constants';
import type { Visitor } from '../core/types';

export type VisitorMood =
  | 'happy'
  | 'neutral'
  | 'unhappy' // approaching misery (early)
  | 'miserable' // near misery (late)
  | 'anxious' // approaching panic (early)
  | 'scared'; // near panic (late)

export const getVisitorMood = (v: Visitor): VisitorMood => {
  const fearMax = EMOTION_BOUNDS.fear.max;
  const happyMax = EMOTION_BOUNDS.happiness.max;

  const fear = v.fear / fearMax;
  const happiness = v.happiness / happyMax;

  // --- FEAR DOMINATES ---
  // Anchor the "late warning" just below panic, and "early warning" earlier.
  const normalizedPanic = FEAR_PANIC_THRESHOLD / fearMax; // e.g. 0.90
  const normalizedScared = Math.max(0, normalizedPanic - 0.05); // e.g. 0.85 (near panic)
  const normalizedAnxious = Math.max(0, normalizedPanic - 0.2); // e.g. 0.70 (approaching panic)

  if (fear >= normalizedScared) return 'scared';
  if (fear >= normalizedAnxious) return 'anxious';

  // --- HAPPY (clearly safe) ---
  if (happiness >= 0.7 && fear <= 0.2) return 'happy';

  // --- MISERY APPROACH (only when fear isn't already dominating) ---
  const normalezedMisery = HAPPINESS_MISERY_THRESHOLD / happyMax; // e.g. 0.05
  const normalizedMiserable = Math.min(1, normalezedMisery + 0.1); // e.g. 0.15 (near misery)
  const unhappy01 = Math.min(1, normalezedMisery + 0.3); // e.g. 0.35 (approaching misery)

  if (happiness <= normalizedMiserable) return 'miserable';
  if (happiness <= unhappy01) return 'unhappy';

  return 'neutral';
};
