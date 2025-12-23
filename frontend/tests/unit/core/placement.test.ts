import { placeRoom } from '../../../src/core/placement';
import type { Grid } from '../../../src/core/types';

const makeGrid = (w: number, h: number): Grid =>
  Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ({
      type: 'floor',
      occupied: false,
      roomId: null,
      roomType: null,
    })),
  );

describe('placeRoom', () => {
  const costs = { entry: 50, hallway: 100, scare: 200, parkEntry: 0, parkExit: 0 } as const;

  it('places a room, deducts money, returns deterministic roomId', () => {
    const grid = makeGrid(3, 3);
    const r = placeRoom({
      grid,
      x: 1,
      y: 2,
      roomType: 'hallway',
      money: 1000,
      costByType: costs,
      nextRoomId: 1,
    });

    expect(r.result).toEqual({ ok: true, roomId: 'hallway-1' });
    expect(r.money).toBe(900);
    expect(r.nextRoomId).toBe(2);
    expect(r.grid[2][1]).toMatchObject({ occupied: true, roomId: 'hallway-1' });

    // original grid unchanged
    expect(grid[2][1]).toMatchObject({ occupied: false, roomId: null });
  });

  it('fails with cell_occupied and does not change anything', () => {
    const grid = makeGrid(3, 3);
    const first = placeRoom({
      grid,
      x: 0,
      y: 0,
      roomType: 'entry',
      money: 1000,
      costByType: costs,
      nextRoomId: 1,
    });

    const beforeGrid = first.grid;
    const beforeMoney = first.money;
    const beforeId = first.nextRoomId;

    const second = placeRoom({
      grid: beforeGrid,
      x: 0,
      y: 0,
      roomType: 'entry',
      money: beforeMoney,
      costByType: costs,
      nextRoomId: beforeId,
    });

    expect(second.result).toEqual({ ok: false, reason: 'cell_occupied' });
    expect(second.grid).toBe(beforeGrid); // returns same reference on fail
    expect(second.money).toBe(beforeMoney);
    expect(second.nextRoomId).toBe(beforeId);
  });

  it('fails with insufficient_funds and does not change anything', () => {
    const grid = makeGrid(2, 2);
    const r = placeRoom({
      grid,
      x: 1,
      y: 1,
      roomType: 'scare',
      money: 10,
      costByType: costs,
      nextRoomId: 1,
    });

    expect(r.result).toEqual({ ok: false, reason: 'insufficient_funds' });
    expect(r.grid).toBe(grid);
    expect(r.money).toBe(10);
    expect(r.nextRoomId).toBe(1);
  });

  it('fails with out_of_bounds and does not change anything', () => {
    const grid = makeGrid(2, 2);
    const r = placeRoom({
      grid,
      x: 9,
      y: 9,
      roomType: 'hallway',
      money: 1000,
      costByType: costs,
      nextRoomId: 1,
    });

    expect(r.result).toEqual({ ok: false, reason: 'out_of_bounds' });
    expect(r.grid).toBe(grid);
  });
});
