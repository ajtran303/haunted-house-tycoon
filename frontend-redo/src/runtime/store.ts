import { create } from 'zustand';

import { ADMISSION_FEE } from '../core/constants';
import { newGame } from '../core/newGame';
import { applyTimeTick } from '../core/time';
import type { GameState, Lifecycle, Visitor } from '../core/types';

type Actions = {
  newGame: () => void;
  startRun: () => void;
  pause: () => void;
  tickOnce: () => void;

  startRunWithInitialVisitor: () => void;
  spawnVisitorAtEntrance: () => void;
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

    set({
      ...nextTime,
    });
  },

  startRunWithInitialVisitor: () => {
    const s = get();

    if (s.visitors.length === 0 && s.lifecycle !== 'running') {
      set({ lifecycle: 'running' as Lifecycle });
      get().spawnVisitorAtEntrance();
      return;
    }

    set({ lifecycle: 'running' as Lifecycle });
  },

  spawnVisitorAtEntrance: () => {
    const s = get();
    if (s.lifecycle !== 'running') return;

    const id = s.nextVisitorId;

    const entrance = s.entrance;
    const visitor: Visitor = { id: id, position: entrance };

    set({
      visitors: [...s.visitors, visitor],
      nextVisitorId: s.nextVisitorId + 1,
      money: s.money + ADMISSION_FEE,
    });
  },
}));
