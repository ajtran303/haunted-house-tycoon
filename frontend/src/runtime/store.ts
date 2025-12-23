import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { ADMISSION_FEE, ROOM_COST } from '../core/constants';
import { newGame } from '../core/newGame';
import { placeRoom } from '../core/placement';
import { applyTimeTick } from '../core/time';
import type { GameState, Lifecycle, RoomType, Visitor } from '../core/types';

type Input =
  | { type: 'selectRoomType'; roomType: RoomType }
  | { type: 'clickCell'; x: number; y: number };

type Actions = {
  // lifecycle
  newGame: () => void;
  startRun: () => void;
  pause: () => void;
  startRunWithInitialVisitor: () => void;

  // time
  tickOnce: () => void;

  // speed
  setSpeed1x: () => void;
  setSpeed4x: () => void;

  // placement
  spawnVisitorAtEntrance: () => void;
  placeRoomAt: (x: number, y: number) => void;

  dispatchInput: (input: Input) => void;
};

export const useGameStore = create(
  subscribeWithSelector<GameState & Actions>((set, get) => ({
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

    placeRoomAt: (x, y) => {
      const s = get();
      const applied = placeRoom({
        grid: s.grid,
        x,
        y,
        roomType: s.selectedRoomType,
        money: s.money,
        costByType: ROOM_COST,
        nextRoomId: s.nextRoomId,
      });

      if (!applied.result.ok) return;

      set({
        grid: applied.grid,
        money: applied.money,
        nextRoomId: applied.nextRoomId,
      });
    },

    dispatchInput: (input) => {
      const s = get();

      if (input.type === 'selectRoomType') {
        set({ selectedRoomType: input.roomType });
        return;
      }

      if (input.type === 'clickCell') {
        if (s.lifecycle !== 'running') return;
        get().placeRoomAt(input.x, input.y);
      }
    },
  })),
);
