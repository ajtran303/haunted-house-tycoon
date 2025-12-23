import type { Cell, Grid, RoomType } from './types';

export type PlaceRoomOk = {
  ok: true;
  roomId: string;
};

export type PlaceRoomFail = {
  ok: false;
  reason: 'out_of_bounds' | 'cell_occupied' | 'insufficient_funds';
};

export type PlaceRoomResult = PlaceRoomOk | PlaceRoomFail;

export type PlaceRoomArgs = {
  grid: Grid;
  x: number;
  y: number;
  roomType: RoomType;
  money: number;
  costByType: Record<RoomType, number>;
  nextRoomId: number;
};

export type PlaceRoomApply = {
  grid: Grid;
  money: number;
  nextRoomId: number;
  result: PlaceRoomResult;
};

// Immutable helpers (no mutation)
const cloneGrid = (grid: Grid): Grid => grid.map((row) => row.map((c) => ({ ...c })));

export const placeRoom = (args: PlaceRoomArgs): PlaceRoomApply => {
  const { grid, x, y, roomType, money, costByType, nextRoomId } = args;

  // bounds
  if (y < 0 || y >= grid.length) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'out_of_bounds' } };
  }
  if (x < 0 || x >= grid[0].length) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'out_of_bounds' } };
  }

  const cost = costByType[roomType];
  if (money < cost) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'insufficient_funds' } };
  }

  const cell = grid[y][x];
  if (cell.occupied) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'cell_occupied' } };
  }

  const newGrid = cloneGrid(grid);
  const id = `${roomType}-${nextRoomId}`;

  newGrid[y][x] = {
    ...newGrid[y][x],
    occupied: true,
    roomId: id,
    roomType,
    type: 'floor', // placeholder
  } satisfies Cell;

  return {
    grid: newGrid,
    money: money - cost,
    nextRoomId: nextRoomId + 1,
    result: { ok: true, roomId: id },
  };
};
