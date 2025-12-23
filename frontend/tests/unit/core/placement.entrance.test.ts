import { createGrid } from '../../../src/core/grid';
import { placeRoom } from '../../../src/core/placement';
import type { RoomType } from '../../../src/core/types';

const costs = {
  entry: 50,
  hallway: 100,
  scare: 200,
  parkEntry: 0,
} satisfies Record<RoomType, number>;

describe('placeRoom - parkEntry rules', () => {
  it('allows first parkEntry on an edge', () => {
    const grid = createGrid(5, 5);

    const r = placeRoom({
      grid,
      x: 0,
      y: 2,
      roomType: 'parkEntry',
      money: 0,
      costByType: costs,
      nextRoomId: 1,
    });

    expect(r.result.ok).toBe(true);
    if (!r.result.ok) throw new Error('expected ok');
    expect(r.grid[2][0].roomType).toBe('parkEntry');
  });

  it('rejects parkEntry if not on an edge', () => {
    const grid = createGrid(5, 5);

    const r = placeRoom({
      grid,
      x: 2,
      y: 2,
      roomType: 'parkEntry',
      money: 0,
      costByType: costs,
      nextRoomId: 1,
    });

    expect(r.result).toEqual({ ok: false, reason: 'invalid_entrance_placement' });
    // no mutation
    expect(r.grid).toBe(grid);
  });

  it('rejects a second parkEntry anywhere', () => {
    const grid = createGrid(5, 5);

    const first = placeRoom({
      grid,
      x: 0,
      y: 0,
      roomType: 'parkEntry',
      money: 0,
      costByType: costs,
      nextRoomId: 1,
    });

    expect(first.result.ok).toBe(true);

    const second = placeRoom({
      grid: first.grid,
      x: 4,
      y: 4,
      roomType: 'parkEntry',
      money: 0,
      costByType: costs,
      nextRoomId: first.nextRoomId,
    });

    expect(second.result).toEqual({ ok: false, reason: 'entrance_already_exists' });
    // no mutation on fail
    expect(second.grid).toBe(first.grid);
    // still only one entrance on the grid
    const entrances = second.grid.flat().filter((c) => c.occupied && c.roomType === 'parkEntry');
    expect(entrances).toHaveLength(1);
  });
});
