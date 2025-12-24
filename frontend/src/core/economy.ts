import { BASE_UPKEEP_PER_TICK, ROOM_UPKEEP_PER_TICK } from './constants';
import type { Grid, RoomType } from './types';

export const countRoomsByType = (grid: Grid): Record<RoomType, number> => {
  const out: Record<RoomType, number> = {
    entry: 0,
    hallway: 0,
    scare: 0,
    exit: 0,
    parkEntry: 0,
    parkExit: 0,
  };

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (!c.occupied || !c.roomType) continue;
      out[c.roomType] += 1;
    }
  }
  return out;
};

export const upkeepPerTick = (grid: Grid): number => {
  const counts = countRoomsByType(grid);
  let total = BASE_UPKEEP_PER_TICK;

  (Object.keys(counts) as RoomType[]).forEach((rt) => {
    const rate = ROOM_UPKEEP_PER_TICK[rt] ?? 0;
    total += counts[rt] * rate;
  });

  return total;
};
