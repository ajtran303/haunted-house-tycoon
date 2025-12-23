import { ROOM_COST } from './constants';
import type { Cell, Grid, RoomType } from './types';

export type PlaceRoomOk = {
  ok: true;
  roomId: string;
};

export type PlaceRoomFail = {
  ok: false;
  reason:
    | 'out_of_bounds'
    | 'cell_occupied'
    | 'insufficient_funds'
    | 'invalid_entrance_placement'
    | 'entrance_already_exists';
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

const cloneGrid = (grid: Grid): Grid => grid.map((row) => row.map((c) => ({ ...c })));

const isEdge = (x: number, y: number, w: number, h: number) =>
  x === 0 || y === 0 || x === w - 1 || y === h - 1;

const hasParkEntry = (grid: Grid): boolean =>
  grid.some((row) => row.some((c) => c.occupied && c.roomType === 'parkEntry'));

const clearExistingParkEntry = (g: Grid): Grid => {
  const next = cloneGrid(g);
  for (let yy = 0; yy < next.length; yy++) {
    for (let xx = 0; xx < next[0].length; xx++) {
      const c = next[yy][xx];
      if (c.occupied && c.roomType === 'parkEntry') {
        next[yy][xx] = { ...c, occupied: false, roomId: null, roomType: null };
      }
    }
  }
  return next;
};

export const placeRoom = (args: PlaceRoomArgs): PlaceRoomApply => {
  const { grid, x, y, roomType, money, nextRoomId } = args;

  // bounds
  if (y < 0 || y >= grid.length) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'out_of_bounds' } };
  }
  if (x < 0 || x >= grid[0].length) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'out_of_bounds' } };
  }

  const w = grid[0].length;
  const h = grid.length;

  if (roomType === 'parkEntry') {
    if (hasParkEntry(grid)) {
      return { grid, money, nextRoomId, result: { ok: false, reason: 'entrance_already_exists' } };
    }
    if (!isEdge(x, y, w, h)) {
      return {
        grid,
        money,
        nextRoomId,
        result: { ok: false, reason: 'invalid_entrance_placement' },
      };
    }
  }
  const cost = ROOM_COST[roomType];
  if (money < cost) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'insufficient_funds' } };
  }

  const baseGrid = roomType === 'parkEntry' ? clearExistingParkEntry(grid) : grid;
  const cell = baseGrid[y][x];
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
