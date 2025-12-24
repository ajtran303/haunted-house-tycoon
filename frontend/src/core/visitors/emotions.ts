import { EMOTION_BOUNDS } from '../constants';
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
