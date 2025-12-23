import { TICKS_PER_VISITOR_SPAWN } from './constants';

export const shouldSpawnFakeVisitor = (tick: number): boolean => {
  if (tick === 0) return false;
  if (tick === 1) return true;
  return tick % TICKS_PER_VISITOR_SPAWN === 0;
};
