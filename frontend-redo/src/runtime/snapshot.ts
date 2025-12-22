import type { GameState } from '../core/types';

export const selectSnapshot = (s: GameState) => ({
  lifecycle: s.lifecycle,
  day: s.day,
  tick: s.tick,
  money: s.money,
  visitors: s.visitors,
  grid: s.grid,
  staffEnabled: s.staffEnabled,
});
