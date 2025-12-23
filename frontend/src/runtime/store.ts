import { create } from 'zustand';

import { ADMISSION_FEE, ROOM_COSTS } from '../core/constants';
import { newGame } from '../core/newGame';
import { placeRoom, RoomType } from '../core/placement';
import { applyTimeTick } from '../core/time';
import type { GameState, Lifecycle, Visitor } from '../core/types';

type Actions = {
  newGame: () => void;
  startRun: () => void;

  pause: () => void;

  setSpeed1x: () => void;
  setSpeed4x: () => void;

  tickOnce: () => void;

  startRunWithInitialVisitor: () => void;
  spawnVisitorAtEntrance: () => void;

  placeRoomAt: (x: number, y: number, roomType: RoomType) => void;
};

export const useGameStore = create<GameState & Actions>((set, get) => ({
  ...newGame(),

  newGame: () => set(newGame()),

  startRun: () => set({ lifecycle: 'running' as Lifecycle }),

  pause: () => set({ lifecycle: 'paused' as Lifecycle }),

  setSpeed1x: () => set({ speed: 1 }),

  setSpeed4x: () => set({ speed: 4 }),

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

  placeRoomAt: (x, y, roomType) => {
    const s = get();
    const applied = placeRoom({
      grid: s.grid,
      x,
      y,
      roomType,
      money: s.money,
      costByType: ROOM_COSTS,
      nextRoomId: s.nextRoomId,
    });

    if (!applied.result.ok) return;

    set({
      grid: applied.grid,
      money: applied.money,
      nextRoomId: applied.nextRoomId,
    });
  },
}));
