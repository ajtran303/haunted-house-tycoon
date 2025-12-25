import { TICKS_PER_VISITOR_SPAWN } from './constants';

export const shouldSpawnVisitor = (tick: number): boolean => {
  if (tick === 1) return true;
  if (tick <= 0) return false;
  return tick % TICKS_PER_VISITOR_SPAWN === 0;
};
