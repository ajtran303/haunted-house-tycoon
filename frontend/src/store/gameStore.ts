import { create } from 'zustand';

import type { Cell } from '../domain/cell';
import { createGrid, type Grid,setCell } from '../domain/grid';


export type GameState = {
  day: number;
  totalTime: number;
  timeSinceLastTick: number;
  money: number;
  visitors: number;

  gridWidth: number;
  gridHeight: number;
  grid: Grid;

  gridVersion: number;

  setCellAt: (x: number, y: number, cell: Cell) => void;

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
  gridVersion: 0,

  setCellAt: (x, y, cell) => {
    const { grid } = get();
    set({ grid: setCell(grid, x, y, cell) });
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
