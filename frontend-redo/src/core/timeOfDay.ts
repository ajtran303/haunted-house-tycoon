// src/core/timeOfDay.ts
import { NIGHT_START_TICK, TICKS_PER_DAY } from './constants';

export type TimeOfDay = 'day' | 'night';

export const getTickInDay = (tick: number): number => tick % TICKS_PER_DAY;

export const getTimeOfDay = (tick: number): TimeOfDay => {
  const tickInDay = getTickInDay(tick);
  return tickInDay >= NIGHT_START_TICK ? 'night' : 'day';
};
