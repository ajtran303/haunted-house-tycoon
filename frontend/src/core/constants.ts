import { RoomType } from './types';

export const GRID_WIDTH = 12;
export const GRID_HEIGHT = 8;

export const START_DAY = 1;
export const START_TICK = 0;

export const STARTING_MONEY = 1000;

export const TICKS_PER_DAY = 60;
export const NIGHT_START_TICK = Math.floor(TICKS_PER_DAY * 0.5);

export const ADMISSION_FEE = 10;

export const ENTRANCE_X = 0;
export const ENTRANCE_Y = 0;

export const ROOM_COST: Record<RoomType, number> = {
  entry: 50,
  exit: 50,
  hallway: 100,
  scare: 200,
  parkEntry: 0,
  parkExit: 0,
};

export const TICKS_PER_VISITOR_SPAWN = 5;
export const MONEY_PER_VISITOR_PER_TICK = 5; // for testing

export const EMOTION_MIN = 0;
export const EMOTION_MAX = 100;

export const EMOTION_BOUNDS = {
  fear: {
    min: 0,
    max: 100,
  },
  happiness: {
    min: 0,
    max: 100,
  },
} as const;

export const VISITOR_START_FEAR = 0;
export const VISITOR_START_HAPPINESS = 60;
export const HAPPINESS_DECAY_PER_TICK = 1;

export const BASE_SPEND_PER_TICK = 1;

export const FEAR_SPEND_BOOST_START = 20; // fear below this gives no bonus
export const FEAR_SPEND_BOOST_CAP = 80; // fear at/above this gives max bonus (but below panic)
export const FEAR_PANIC_THRESHOLD = 90; // fear at/above this triggers exit
export const MAX_FEAR_BONUS_PER_TICK = 4; // at FEAR_SPEND_BOOST_CAP

export const HAPPY_SPEND_BOOST_START = 60; // happiness above this boosts spend
export const UNHAPPY_SPEND_STOP = 10; // happiness at/below this stops spend
export const HAPPINESS_MISERY_THRESHOLD = 5; // happiness below this triggers exit
export const MAX_HAPPY_BONUS_PER_TICK = 6; // at happiness 100 (or your max)
