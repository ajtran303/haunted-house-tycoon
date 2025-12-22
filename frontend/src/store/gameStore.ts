import { create } from 'zustand';

export type GameState = {
  day: number
  timeElapsed: number;
  money: number
  visitors: number
  tick: () => void
  advanceTime: (delta: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  day: 1,
  timeElapsed: 0,
  money: 1000,
  visitors: 0,
  tick: () =>
    set((state) => {
      const newVisitors = state.visitors + 2;
      return {
        visitors: newVisitors,
        day: state.day + 1,
        money: state.money + newVisitors * 2, 
      };
    }),
  advanceTime: (delta) => {
    set((state) => ({
      timeElapsed: state.timeElapsed + delta
    }))
}}))
