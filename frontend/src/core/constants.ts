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
  hallway: 100,
  scare: 200,
};

export const TICKS_PER_VISITOR_SPAWN = 5;
export const MONEY_PER_VISITOR_PER_TICK = 1; // for testing
