import { EMOTION_BOUNDS, FEAR_RECOVERY_PER_TICK, HAPPINESS_DECAY_PER_TICK } from '../constants';
import type { Visitor } from '../types';

export type Emotion = 'fear' | 'happiness';

export const clampEmotion = (stat: Emotion, value: number): number => {
  const { min, max } = EMOTION_BOUNDS[stat];
  return Math.max(min, Math.min(max, value));
};

export type EmotionDelta = {
  fear?: number;
  happiness?: number;
};

export const applyEmotionDelta = (v: Visitor, delta: EmotionDelta): Visitor => ({
  ...v,
  fear: clampEmotion('fear', v.fear + (delta.fear ?? 0)),
  happiness: clampEmotion('happiness', v.happiness + (delta.happiness ?? 0)),
});

export const decayHappiness = (v: Visitor, amount = HAPPINESS_DECAY_PER_TICK): Visitor => {
  // Visitors do not passively lose happiness while actively in an attraction.
  if (v.location.type === 'attraction') return v;

  const nextHappiness = clampEmotion('happiness', v.happiness - amount);

  return nextHappiness === v.happiness ? v : { ...v, happiness: nextHappiness };
};

export const decayHappinessForVisitors = (
  visitors: Visitor[],
  amount = HAPPINESS_DECAY_PER_TICK,
): Visitor[] => visitors.map((v) => decayHappiness(v, amount));

/**
 * Recover fear for a visitor on the midway.
 * Fear does not recover inside attractions.
 */
export const recoverFear = (v: Visitor, amount = FEAR_RECOVERY_PER_TICK): Visitor => {
  // Fear only recovers on the midway, not in attractions
  if (v.location.type === 'attraction') return v;

  const nextFear = clampEmotion('fear', v.fear - amount);

  return nextFear === v.fear ? v : { ...v, fear: nextFear };
};

export const recoverFearForVisitors = (
  visitors: Visitor[],
  amount = FEAR_RECOVERY_PER_TICK,
): Visitor[] => visitors.map((v) => recoverFear(v, amount));
