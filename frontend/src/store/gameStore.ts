import { create } from 'zustand';

import type { Cell } from '../domain/cell';
import { createGrid, type Grid, setCell } from '../domain/grid';
import type { PlaceRoomResult } from '../domain/placeRoomResult';
import type { RoomType } from '../domain/rooms';
import { ROOM_DEFS } from '../domain/rooms';

export type GameState = {
  day: number;
  totalTime: number;
  timeSinceLastTick: number;
  money: number;
  visitors: number;

  gridWidth: number;
  gridHeight: number;
  grid: Grid;

  setCellAt: (x: number, y: number, cell: Cell) => void;
  placeRoomAt: (x: number, y: number, roomType: RoomType) => PlaceRoomResult

  tick: (resetTimeSinceLastTick?: boolean) => void;
  advanceTime: (delta: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  day: 1,
  totalTime: 0,
  timeSinceLastTick: 0,
  money: 1000,
  visitors: 0,

  gridWidth: 20,
  gridHeight: 15,
  grid: createGrid(20, 15),

  setCellAt: (x, y, cell) => {
    const { grid } = get();
    set({ grid: setCell(grid, x, y, cell) });
  },

  placeRoomAt: (x, y, roomType) => {
    const state = get();
    const def = ROOM_DEFS[roomType];

    if (!def) {
      return {
        ok: false,
        reason: 'unknown_room_type',
        feedback: { type: 'toast', message: 'Unknown room type' },
      };
    }

    // bounds
    if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) {
      return {
        ok: false,
        reason: 'out_of_bounds',
        feedback: { type: 'toast', message: 'Out of bounds' },
      };
    }

    // convert logical y (bottom-left) -> storage row (top-left)
    const row = (state.gridHeight - 1) - y;
    const current = state.grid[row][x];

    if (current.occupied) {
      return {
        ok: false,
        reason: 'cell_occupied',
        feedback: { type: 'flash_cell', x, y },
      };
    }

    if (current.type !== 'empty') {
      return {
        ok: false,
        reason: 'cell_not_empty',
        feedback: { type: 'flash_cell', x, y },
      };
    }

    if (state.money < def.cost) {
      return {
        ok: false,
        reason: 'not_enough_money',
        feedback: { type: 'toast', message: 'Not enough money' },
      };
    }

    const roomId = `${roomType}-${state.totalTime.toFixed(0)}-${x}-${y}`;
    const nextGrid = setCell(state.grid, x, row, {
      type: def.cellType,
      occupied: true,
      roomId,
    });

    set({
      grid: nextGrid,
      money: state.money - def.cost,
    });

    return { ok: true, roomId };
  },

  tick: () => {
    const state = get();
    const newVisitors = 2; // visitors entering this tick
    set({
      day: state.day + 1,
      visitors: state.visitors + newVisitors,
      money: state.money + newVisitors * 100, // only new visitors pay
    });
  },

  advanceTime: (delta) => {
    const state = get();
    const newTotal = state.totalTime + delta;
    const newTimeSinceTick = state.timeSinceLastTick + delta;

    // How many full 1000ms ticks happened
    const fullTicks = Math.floor(newTimeSinceTick / 1000);

    // Apply ticks
    for (let i = 0; i < fullTicks; i++) {
      get().tick();
    }

    // Update totalTime and leftover timeSinceLastTick
    set({
      totalTime: newTotal,
      timeSinceLastTick: newTimeSinceTick % 1000,
    });
  },
}));
