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
      return {
        visitors: state.visitors + 2,
        day: state.day + 1,
        money: state.money + state.visitors * 2, 
      };
    }),
  advanceTime: (delta) => {
    set((state) => ({
      timeElapsed: state.timeElapsed + delta
    }))
}}))
