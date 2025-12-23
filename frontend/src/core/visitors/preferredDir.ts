import { hash32 } from '../rng';
import { type Dir, DIRS } from './dirs';

export const preferredDir = (visitorId: number, tick: number): Dir => {
  // change slowly to avoid jitter: bucket ticks (like every 5)
  const bucket = Math.floor(tick / 5);
  const h = hash32(visitorId * 1000003 + bucket);
  return DIRS[h % 4];
};
