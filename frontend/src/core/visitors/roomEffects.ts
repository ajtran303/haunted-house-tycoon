import type { RoomType } from '../types';

export type EmotionDelta = { fear?: number; happiness?: number };

export const ROOM_EMOTION_EFFECTS: Partial<Record<RoomType, EmotionDelta>> = {
  entry: { happiness: +2 },
  hallway: {
    /* neutral */
  },
  scare: { fear: +8, happiness: -2 },
  exit: {
    /* optional: neutral */
  },

  parkEntry: {
    /* neutral */
  },
  parkExit: {
    /* neutral */
  },
};
