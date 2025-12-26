import type { Cell, Grid, RoomType, Vector } from './types';

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

// Multi-cell room shapes defined as cell offsets from placement origin
export const MULTI_CELL_ROOMS: Partial<Record<RoomType, { cells: Vector[] }>> = {
  // 2x2 portal
  attractionPortal: {
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  // I-shapes (3 cells in a line)
  giftShop: {
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
  }, // 3x1 horizontal
  restroom: {
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
  }, // 1x3 vertical
  // L-shapes (3 cells in L pattern)
  photoBooth: {
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  }, // L-up-right
  arcade: {
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  }, // L-down-right
  firstAid: {
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  }, // L-down-left
  foodStall: {
    cells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  }, // L-up-left
};

/** Get the cells for a room type (defaults to single cell at origin) */
export const getRoomCells = (roomType: RoomType): Vector[] =>
  MULTI_CELL_ROOMS[roomType]?.cells ?? [{ x: 0, y: 0 }];

/** Get the bounding box size of a room type (for preview rendering) */
export const getRoomSize = (roomType: RoomType): { width: number; height: number } => {
  const cells = getRoomCells(roomType);
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  return { width: maxX + 1, height: maxY + 1 };
};

export const placeRoom = (args: PlaceRoomArgs): PlaceRoomApply => {
  const { grid, x, y, roomType, money, costByType, nextRoomId } = args;

  const h = grid.length;
  const w = grid[0]?.length ?? 0;

  const cells = getRoomCells(roomType);
  const isMultiCell = cells.length > 1;

  // Check bounds for all cells
  for (const cell of cells) {
    const cx = x + cell.x;
    const cy = y + cell.y;
    if (cy < 0 || cy >= h || cx < 0 || cx >= w) {
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
  for (const cell of cells) {
    const gridCell = grid[y + cell.y]?.[x + cell.x];
    if (!gridCell || gridCell.occupied) {
      return {
        grid,
        money,
        nextRoomId,
        result: { ok: false, reason: isMultiCell ? 'not_enough_space' : 'cell_occupied' },
      };
    }
  }

  const newGrid = cloneGrid(grid);
  const id = `${roomType}-${nextRoomId}`;

  // Place room in all required cells
  for (const cell of cells) {
    newGrid[y + cell.y][x + cell.x] = {
      ...newGrid[y + cell.y][x + cell.x],
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
