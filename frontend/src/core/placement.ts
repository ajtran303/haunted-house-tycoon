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
    | 'exit_already_exists'
    | 'not_enough_space';
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

// Room types that require 2x2 placement
export const MULTI_CELL_ROOMS: Partial<Record<RoomType, { width: number; height: number }>> = {
  attractionPortal: { width: 2, height: 2 },
};

/** Get the size of a room type (defaults to 1x1) */
export const getRoomSize = (roomType: RoomType): { width: number; height: number } =>
  MULTI_CELL_ROOMS[roomType] ?? { width: 1, height: 1 };

export const placeRoom = (args: PlaceRoomArgs): PlaceRoomApply => {
  const { grid, x, y, roomType, money, costByType, nextRoomId } = args;

  const h = grid.length;
  const w = grid[0]?.length ?? 0;

  const multiCellSize = MULTI_CELL_ROOMS[roomType];

  // Check bounds for multi-cell or single-cell rooms
  if (multiCellSize) {
    const { width: rw, height: rh } = multiCellSize;
    if (y < 0 || y + rh > h || x < 0 || x + rw > w) {
      return { grid, money, nextRoomId, result: { ok: false, reason: 'out_of_bounds' } };
    }
  } else {
    if (y < 0 || y >= h || x < 0 || x >= w) {
      return { grid, money, nextRoomId, result: { ok: false, reason: 'out_of_bounds' } };
    }
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

  // Check if all required cells are available
  if (multiCellSize) {
    const { width: rw, height: rh } = multiCellSize;
    for (let dy = 0; dy < rh; dy++) {
      for (let dx = 0; dx < rw; dx++) {
        const cell = grid[y + dy]?.[x + dx];
        if (!cell || cell.occupied) {
          return { grid, money, nextRoomId, result: { ok: false, reason: 'not_enough_space' } };
        }
      }
    }
  } else {
    const cell = grid[y][x];
    if (cell.occupied) {
      return { grid, money, nextRoomId, result: { ok: false, reason: 'cell_occupied' } };
    }
  }

  const newGrid = cloneGrid(grid);
  const id = `${roomType}-${nextRoomId}`;

  // Place room in all required cells
  if (multiCellSize) {
    const { width: rw, height: rh } = multiCellSize;
    for (let dy = 0; dy < rh; dy++) {
      for (let dx = 0; dx < rw; dx++) {
        newGrid[y + dy][x + dx] = {
          ...newGrid[y + dy][x + dx],
          occupied: true,
          roomId: id,
          roomType,
          type: 'floor',
        } satisfies Cell;
      }
    }
  } else {
    newGrid[y][x] = {
      ...newGrid[y][x],
      occupied: true,
      roomId: id,
      roomType,
      type: 'floor',
    } satisfies Cell;
  }

  return {
    grid: newGrid,
    money: money - cost,
    nextRoomId: nextRoomId + 1,
    result: { ok: true, roomId: id },
  };
};
