import { AMENITY_FEAR_REDUCTION, AMENITY_HAPPINESS_BOOST } from '../constants';
import type { RoomType } from '../types';

export type EmotionDelta = { fear?: number; happiness?: number };

export const ROOM_EMOTION_EFFECTS: Partial<Record<RoomType, EmotionDelta>> = {
  entry: { happiness: +2 },
  hallway: {
    /* neutral */
  },
  scare: { fear: +8 }, // See constants.ts for balance rationale (4:1 vs recovery rate)
  exit: {
    /* optional: neutral */
  },

  parkEntry: {
    /* neutral */
  },
  parkExit: {
    /* neutral */
  },

  // Amenities - all share same stats (can tune individually later)
  foodStall: { happiness: +AMENITY_HAPPINESS_BOOST, fear: -AMENITY_FEAR_REDUCTION },
  giftShop: { happiness: +AMENITY_HAPPINESS_BOOST, fear: -AMENITY_FEAR_REDUCTION },
  restroom: { happiness: +AMENITY_HAPPINESS_BOOST, fear: -AMENITY_FEAR_REDUCTION },
  photoBooth: { happiness: +AMENITY_HAPPINESS_BOOST, fear: -AMENITY_FEAR_REDUCTION },
  arcade: { happiness: +AMENITY_HAPPINESS_BOOST, fear: -AMENITY_FEAR_REDUCTION },
  firstAid: { happiness: +AMENITY_HAPPINESS_BOOST, fear: -AMENITY_FEAR_REDUCTION },
};
