import { EMOTION_BOUNDS, HAPPINESS_DECAY_PER_TICK } from '../constants';
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
  if (v.inAttraction) return v;

  const nextHappiness = clampEmotion('happiness', v.happiness - amount);

  return nextHappiness === v.happiness ? v : { ...v, happiness: nextHappiness };
};

export const decayHappinessForVisitors = (
  visitors: Visitor[],
  amount = HAPPINESS_DECAY_PER_TICK,
): Visitor[] => visitors.map((v) => decayHappiness(v, amount));
