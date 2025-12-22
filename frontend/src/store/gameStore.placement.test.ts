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
    });
  });

  it('places a room on an empty cell, deducts money', () => {
    const store = useGameStore.getState();

    const result = store.placeRoomAt(2, 2, 'hallway');
    expect(result).toEqual({ ok: true, 'roomId': 'hallway-0-2-2' });

    const updated = useGameStore.getState();
    expect(updated.money).toBe(900); // hallway cost 100

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
  });

  it('rejects placement if cell is already occupied', () => {
    const store = useGameStore.getState();

    // First placement ok
    expect(store.placeRoomAt(1, 1, 'hallway')).toEqual({ ok: true, 'roomId': 'hallway-0-1-1' });

    // Second placement same spot fails
    const result2 = useGameStore.getState().placeRoomAt(1, 1, 'entry');
    expect(result2).toEqual({ ok: false, reason: 'cell_occupied' });

    // money only deducted once
    expect(useGameStore.getState().money).toBe(900);
  });

  it('rejects out of bounds', () => {
    const store = useGameStore.getState();

    expect(store.placeRoomAt(-1, 0, 'hallway')).toEqual({ ok: false, reason: 'out_of_bounds' });
    expect(store.placeRoomAt(0, -1, 'hallway')).toEqual({ ok: false, reason: 'out_of_bounds' });
    expect(store.placeRoomAt(5, 0, 'hallway')).toEqual({ ok: false, reason: 'out_of_bounds' });
    expect(store.placeRoomAt(0, 5, 'hallway')).toEqual({ ok: false, reason: 'out_of_bounds' });
  });

  it('rejects placement if cell is not empty (type !== empty)', () => {
    const store = useGameStore.getState();
    const H = useGameStore.getState().gridHeight;
    const row = (H - 1) - 2;

    // Make logical (2,2) be a wall in storage
    useGameStore.setState((s) => {
      const grid = s.grid.slice();
      const r = grid[row].slice();
      r[2] = { type: 'wall', occupied: false, roomId: null };
      grid[row] = r;
      return { grid };
    });

    const result = store.placeRoomAt(2, 2, 'hallway');
    expect(result).toEqual({ ok: false, reason: 'cell_not_empty' });

    expect(useGameStore.getState().money).toBe(1000);
  });

  it('deducts correct costs for each room type', () => {
    const store = useGameStore.getState();

    expect(store.placeRoomAt(0, 0, 'entry')).toEqual({ ok: true, roomId: 'entry-0-0-0' });
    expect(useGameStore.getState().money).toBe(800);

    expect(useGameStore.getState().placeRoomAt(1, 0, 'hallway')).toEqual({ ok: true, roomId: 'hallway-0-1-0' });
    expect(useGameStore.getState().money).toBe(700);

    expect(useGameStore.getState().placeRoomAt(2, 0, 'scare')).toEqual({ ok: true, roomId: 'scare-0-2-0' });
    expect(useGameStore.getState().money).toBe(200);
  });
});
