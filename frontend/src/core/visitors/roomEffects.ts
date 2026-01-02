import { AMENITY_EFFECTS } from '../constants';
import type { RoomType } from '../types';
import type { EmotionDelta } from './emotions';

export const ROOM_EMOTION_EFFECTS: Partial<Record<RoomType, EmotionDelta>> = {
  entry: { happiness: +2 },
  hallway: {
    /* neutral */
  },
  scare: { fear: +6 }, // 6 fear per room, recovery 2/tick = 3 ticks per room to recover
  exit: {
    /* optional: neutral */
  },

  parkEntry: {
    /* neutral */
  },
  parkExit: {
    /* neutral */
  },

  // Amenities - effects scaled to cost (see constants.ts AMENITY_EFFECTS)
  foodStall: {
    happiness: AMENITY_EFFECTS.foodStall.happiness,
    fear: AMENITY_EFFECTS.foodStall.fear,
  },
  giftShop: { happiness: AMENITY_EFFECTS.giftShop.happiness, fear: AMENITY_EFFECTS.giftShop.fear },
  restroom: { happiness: AMENITY_EFFECTS.restroom.happiness, fear: AMENITY_EFFECTS.restroom.fear },
  photoBooth: {
    happiness: AMENITY_EFFECTS.photoBooth.happiness,
    fear: AMENITY_EFFECTS.photoBooth.fear,
  },
  arcade: { happiness: AMENITY_EFFECTS.arcade.happiness, fear: AMENITY_EFFECTS.arcade.fear },
  firstAid: { happiness: AMENITY_EFFECTS.firstAid.happiness, fear: AMENITY_EFFECTS.firstAid.fear },
};
