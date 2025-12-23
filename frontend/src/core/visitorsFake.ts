import { TICKS_PER_VISITOR_SPAWN } from './constants';

export const shouldSpawnFakeVisitor = (tick: number): boolean => {
  if (tick > 0 && tick % TICKS_PER_VISITOR_SPAWN === 0) return true;

  return false;
};
