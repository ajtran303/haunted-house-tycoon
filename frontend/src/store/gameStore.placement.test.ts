import { beforeEach, describe, expect, it } from '@jest/globals';

import { createGrid } from '../domain/grid';
import { useGameStore } from './gameStore';

describe('placeRoomAt(x, y, roomType)', () => {
  beforeEach(() => {
    const prev = useGameStore.getState();
    useGameStore.setState({
      ...prev,
      day: 1,
      totalTime: 0,
      timeSinceLastTick: 0,
      money: 1000,
      visitors: 0,
      gridWidth: 5,
      gridHeight: 5,
      grid: createGrid(5, 5),
      gridVersion: 0
    });
  });

  it('places a room on an empty cell, deducts money, bumps gridVersion', () => {
    const store = useGameStore.getState();

    const result = store.placeRoomAt(2, 2, 'hallway');
    expect(result).toEqual({ ok: true });

    const updated = useGameStore.getState();
    expect(updated.money).toBe(900); // hallway cost 100
    expect(updated.gridVersion).toBe(1);

    // logical (2,2) => storage row = (5-1)-2 = 2
    const cell = updated.grid[2][2];
    expect(cell.type).toBe('floor');
    expect(cell.occupied).toBe(true);
    expect(cell.roomId).toMatch(/^hallway-/);
  });

  it('rejects placement if not enough money', () => {
    useGameStore.setState({ money: 50 });

    const store = useGameStore.getState();
    const result = store.placeRoomAt(1, 1, 'hallway');

    expect(result).toEqual({ ok: false, reason: 'not_enough_money' });
    expect(useGameStore.getState().gridVersion).toBe(0);
  });

  it('rejects placement if cell is already occupied', () => {
    const store = useGameStore.getState();

    // First placement ok
    expect(store.placeRoomAt(1, 1, 'hallway')).toEqual({ ok: true });

    // Second placement same spot fails
    const result2 = useGameStore.getState().placeRoomAt(1, 1, 'entry');
    expect(result2).toEqual({ ok: false, reason: 'cell_occupied' });

    // money only deducted once
    expect(useGameStore.getState().money).toBe(900);
    expect(useGameStore.getState().gridVersion).toBe(1);
  });

  it('rejects out of bounds', () => {
    const store = useGameStore.getState();

    expect(store.placeRoomAt(-1, 0, 'hallway')).toEqual({ ok: false, reason: 'out_of_bounds' });
    expect(store.placeRoomAt(0, -1, 'hallway')).toEqual({ ok: false, reason: 'out_of_bounds' });
    expect(store.placeRoomAt(5, 0, 'hallway')).toEqual({ ok: false, reason: 'out_of_bounds' });
    expect(store.placeRoomAt(0, 5, 'hallway')).toEqual({ ok: false, reason: 'out_of_bounds' });
  });
});
