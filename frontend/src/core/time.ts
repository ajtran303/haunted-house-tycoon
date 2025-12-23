import { TICKS_PER_DAY } from './constants';

export type TimeState = {
  tick: number;
  day: number;
};

export const applyTimeTick = (s: TimeState): TimeState => {
  const nextTick = s.tick + 1;

  const nextDay = nextTick % TICKS_PER_DAY === 0 ? s.day + 1 : s.day;

  // spread now to future-proof adding properties to the type
  return { ...s, tick: nextTick, day: nextDay };
};
