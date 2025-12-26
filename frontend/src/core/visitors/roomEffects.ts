import { AMENITY_FEAR_REDUCTION, AMENITY_HAPPINESS_BOOST } from '../constants';
import type { RoomType } from '../types';

export type EmotionDelta = { fear?: number; happiness?: number };

export const ROOM_EMOTION_EFFECTS: Partial<Record<RoomType, EmotionDelta>> = {
  entry: { happiness: +2 },
  hallway: {
    /* neutral */
  },
  scare: { fear: +8 },
  exit: {
    /* optional: neutral */
  },

  parkEntry: {
    /* neutral */
  },
  parkExit: {
    /* neutral */
  },

  // Amenities - boost happiness, reduce fear
  foodStall: { happiness: +AMENITY_HAPPINESS_BOOST, fear: -AMENITY_FEAR_REDUCTION },
};
