import { create } from 'zustand';

import { newGame } from '../core/newGame';
import { applyTimeTick } from '../core/time';
import type { GameState, Lifecycle } from '../core/types';

type Actions = {
  newGame: () => void;
  startRun: () => void;
  pause: () => void;
  tickOnce: () => void;
};

export const useGameStore = create<GameState & Actions>((set, get) => ({
  ...newGame(),

  newGame: () => set(newGame()),

  startRun: () => set({ lifecycle: 'running' as Lifecycle }),

  pause: () => set({ lifecycle: 'paused' as Lifecycle }),

  tickOnce: () => {
    const state = get();
    if (state.lifecycle !== 'running') return;

    const nextTime = applyTimeTick({ tick: state.tick, day: state.day });
    set(nextTime);
  },
}));
