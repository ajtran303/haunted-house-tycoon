import { create } from 'zustand';

export type GameState = {
  day: number;
  totalTime: number;
  timeSinceLastTick: number;
  money: number;
  visitors: number;
  tick: (resetTimeSinceLastTick?: boolean) => void;
  advanceTime: (delta: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  day: 1,
  totalTime: 0,
  timeSinceLastTick: 0,
  money: 1000,
  visitors: 0,

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
