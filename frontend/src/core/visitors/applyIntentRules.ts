import type { Vector, Visitor } from '../types';
import { DEFAULT_EXPLORE_TICKS_BEFORE_EXIT } from '../constants';

export const applyIntentRules = (
  visitors: Visitor[],
  tick: number,
  exit: Vector | null,
): Visitor[] => {
  if (!exit) return visitors;

  return visitors.map((v): Visitor => {
    if (v.intent !== 'explore') return v;

    const age = tick - v.spawnTick;

    if (age >= DEFAULT_EXPLORE_TICKS_BEFORE_EXIT) return { ...v, intent: 'exit' };

    return v;
  });
};
