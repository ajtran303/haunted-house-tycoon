import type { Cell, Grid, RoomType } from './types';

export type PlaceRoomOk = {
  ok: true;
  roomId: string;
  reason?: null;
};

export type PlaceRoomFail = {
  ok: false;
  reason:
    | 'out_of_bounds'
    | 'cell_occupied'
    | 'insufficient_funds'
    | 'invalid_entrance_placement'
    | 'invalid_exit_placement'
    | 'entrance_already_exists'
    | 'exit_already_exists';
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

const hasRoomType = (grid: Grid, roomType: RoomType): boolean =>
  grid.some((row) => row.some((c) => c.occupied && c.roomType === roomType));

type SpecialRule = {
  uniqueFail: PlaceRoomFail['reason'];
  invalidEdgeFail: PlaceRoomFail['reason'];
};

const SPECIAL_RULES: Partial<Record<RoomType, SpecialRule>> = {
  parkEntry: {
    uniqueFail: 'entrance_already_exists',
    invalidEdgeFail: 'invalid_entrance_placement',
  },
  parkExit: {
    uniqueFail: 'exit_already_exists',
    invalidEdgeFail: 'invalid_exit_placement',
  },
};

export const placeRoom = (args: PlaceRoomArgs): PlaceRoomApply => {
  const { grid, x, y, roomType, money, costByType, nextRoomId } = args;

  const h = grid.length;
  const w = grid[0]?.length ?? 0;

  if (y < 0 || y >= h || x < 0 || x >= w) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'out_of_bounds' } };
  }

  const rule = SPECIAL_RULES[roomType];
  if (rule) {
    if (hasRoomType(grid, roomType)) {
      return { grid, money, nextRoomId, result: { ok: false, reason: rule.uniqueFail } };
    }
    if (!isEdge(x, y, w, h)) {
      return { grid, money, nextRoomId, result: { ok: false, reason: rule.invalidEdgeFail } };
    }
  }

  const cost = costByType[roomType] ?? 0;
  if (money < cost) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'insufficient_funds' } };
  }

  const baseGrid = grid;

  const cell = baseGrid[y][x];
  if (cell.occupied) {
    return { grid, money, nextRoomId, result: { ok: false, reason: 'cell_occupied' } };
  }

  const newGrid = cloneGrid(baseGrid);
  const id = `${roomType}-${nextRoomId}`;

  newGrid[y][x] = {
    ...newGrid[y][x],
    occupied: true,
    roomId: id,
    roomType,
    type: 'floor',
  } satisfies Cell;

  return {
    grid: newGrid,
    money: money - cost,
    nextRoomId: nextRoomId + 1,
    result: { ok: true, roomId: id },
  };
};
