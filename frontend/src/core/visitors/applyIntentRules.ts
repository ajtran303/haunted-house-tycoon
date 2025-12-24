import type { Visitor } from '../types';
import type { Vector } from '../types';

export const EXIT_AFTER_TICKS = 60;

export const applyIntentRules = (
  visitors: Visitor[],
  tick: number,
  exit: Vector | null,
): Visitor[] => {
  if (!exit) return visitors;

  return visitors.map((v): Visitor => {
    if (v.intent !== 'explore') return v;

    const age = tick - v.spawnTick;

    if (age >= EXIT_AFTER_TICKS) {
      return {
        ...v,
        intent: 'exit',
      };
    }

    return v;
  });
};
