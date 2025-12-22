import { beforeEach, describe, expect, it } from '@jest/globals';

import type { Cell } from '../domain/cell';
import { createGrid } from '../domain/grid';
import type { PlaceRoomResult } from '../domain/placeRoomResult';
import type { RoomType } from '../domain/rooms';
import { useGameStore } from './gameStore';

const GRID_W = 5;
const GRID_H = 5;

// Store setup helpers

const resetStore = (overrides: Partial<ReturnType<typeof useGameStore.getState>> = {}) => {
  const prev = useGameStore.getState();
  useGameStore.setState({
    ...prev,
    day: 1,
    totalTime: 0,
    timeSinceLastTick: 0,
    money: 1000,
    visitors: 0,
    gridWidth: GRID_W,
    gridHeight: GRID_H,
    grid: createGrid(GRID_W, GRID_H),
    ...overrides,
  });
};

const logicalToRow = (y: number, gridHeight = useGameStore.getState().gridHeight) => {
  return (gridHeight - 1) - y;
};

const setCellAtLogical = (x: number, y: number, cell: Cell) => {
  const row = logicalToRow(y);
  useGameStore.setState((s) => {
    const grid = s.grid.slice();
    const r = grid[row].slice();
    r[x] = cell;
    grid[row] = r;
    return { grid };
  });
};

const place = (x: number, y: number, roomType: RoomType): PlaceRoomResult => {
  return useGameStore.getState().placeRoomAt(x, y, roomType);
};

// Typed assertion helpers

type OkResult = Extract<PlaceRoomResult, { ok: true }>;
type FailResult = Extract<PlaceRoomResult, { ok: false }>;

type FailReason = FailResult['reason'];
type FailFeedback = FailResult['feedback'];

function expectOk(result: PlaceRoomResult, prefix?: RoomType): OkResult {
  // Structural narrowing: failure variant has 'reason', success does not.
  if ('reason' in result) {
    throw new Error(`Expected ok result, got failure: ${result.reason}`);
  }

  if (prefix) {
    expect(result.roomId).toMatch(new RegExp(`^${prefix}-`));
  }
  return result;
}

function expectFail(result: PlaceRoomResult, reason: FailReason, feedback: FailFeedback): FailResult {
  // Structural narrowing: success variant has no 'reason'
  if (!('reason' in result)) {
    throw new Error(`Expected failure result, got ok: ${result.roomId}`);
  }

  expect(result.reason).toBe(reason);
  expect(result.feedback).toEqual(feedback);
  return result;
}

beforeEach(() => {
  resetStore();
});

describe('placeRoomAt(x, y, roomType)', () => {
  it('places a room on an empty cell, updates grid, deducts money', () => {
    const ok = expectOk(place(2, 2, 'hallway'), 'hallway');

    const updated = useGameStore.getState();
    expect(updated.money).toBe(900);

    const row = logicalToRow(2);
    const cell = updated.grid[row][2];

    expect(cell).toMatchObject({
      type: 'floor',
      occupied: true,
    });

    expect(cell.roomId).toMatch(/^hallway-/);
    expect(cell.roomId).toBe(ok.roomId);
  });

  it('rejects placement if not enough money (no deduction)', () => {
    resetStore({ money: 50 });

    const result = place(1, 1, 'hallway');

    expectFail(result, 'not_enough_money', {
      type: 'toast',
      message: 'Not enough money',
    });

    expect(useGameStore.getState().money).toBe(50);
  });

  it('rejects placement if cell is already occupied (money deducted once)', () => {
    expectOk(place(1, 1, 'hallway'), 'hallway');

    const result2 = place(1, 1, 'entry');

    expectFail(result2, 'cell_occupied', {
      type: 'flash_cell',
      x: 1,
      y: 1,
    });

    expect(useGameStore.getState().money).toBe(900);
  });

  it('rejects placement if cell is not empty (type !== empty)', () => {
    setCellAtLogical(2, 2, { type: 'wall', occupied: false, roomId: null });

    const result = place(2, 2, 'hallway');

    expectFail(result, 'cell_not_empty', {
      type: 'flash_cell',
      x: 2,
      y: 2,
    });

    expect(useGameStore.getState().money).toBe(1000);
  });

  describe.each([
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: GRID_W, y: 0 },
    { x: 0, y: GRID_H },
  ])('out of bounds (%s)', ({ x, y }) => {
    it(`rejects (${x}, ${y}) with toast feedback`, () => {
      const result = place(x, y, 'hallway');

      expectFail(result, 'out_of_bounds', {
        type: 'toast',
        message: 'Out of bounds',
      });
    });
  });

  it('deducts correct costs for each room type', () => {
    expectOk(place(0, 0, 'entry'), 'entry');
    expect(useGameStore.getState().money).toBe(800); // entry cost 200

    expectOk(place(1, 0, 'hallway'), 'hallway');
    expect(useGameStore.getState().money).toBe(700); // hallway cost 100

    expectOk(place(2, 0, 'scare'), 'scare');
    expect(useGameStore.getState().money).toBe(200); // scare cost 500
  });
});
