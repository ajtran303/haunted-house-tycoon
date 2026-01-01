import type { GameState } from '../core/types';

export const selectSnapshot = (s: GameState) => ({
  lifecycle: s.lifecycle,
  day: s.day,
  tick: s.tick,
  money: s.money,
  visitors: s.visitors,
  midwayGrid: s.midwayGrid,
  staffHired: s.staffHired,
  staffAssignments: s.staffAssignments,
});
