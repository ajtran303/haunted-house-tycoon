import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { ADMISSION_FEE, MONEY_PER_VISITOR_PER_TICK, ROOM_COST } from '../core/constants';
import { newGame } from '../core/newGame';
import { placeRoom } from '../core/placement';
import { applyTimeTick } from '../core/time';
import type { GameState, Lifecycle, RoomType, Visitor } from '../core/types';
import { shouldSpawnFakeVisitor } from '../core/visitorsFake';

type Input =
  | { type: 'selectRoomType'; roomType: RoomType }
  | { type: 'clickCell'; x: number; y: number };

type Actions = {
  // lifecycle
  newGame: () => void;
  startRun: () => void;
  pause: () => void;
  startRunWithInitialVisitor: () => void;

  // speed
  setSpeed1x: () => void;
  setSpeed4x: () => void;

  // time
  tickOnce: () => void;

  // visitors
  spawnVisitor: () => void;

  // placement
  placeRoomAt: (x: number, y: number) => void;

  // input
  dispatchInput: (input: Input) => void;
};

export const useGameStore = create(
  subscribeWithSelector<GameState & Actions>((set, get) => ({
    ...newGame(),

    newGame: () => set(newGame()),

    startRun: () => set({ lifecycle: 'running' as Lifecycle }),

    pause: () => set({ lifecycle: 'paused' as Lifecycle }),

    // Start/run + ensure exactly one initial visitor (and only once)
    startRunWithInitialVisitor: () => {
      const s = get();

      if (s.lifecycle === 'running') return;

      set({ lifecycle: 'running' as Lifecycle });

      // Spawn exactly one initial visitor if none exist yet.
      // Admission is charged on spawn (once per visitor).
      if (s.visitors.length === 0) {
        get().spawnVisitor();
      }
    },

    setSpeed1x: () => set({ speed: 1 }),
    setSpeed4x: () => set({ speed: 4 }),

    // time tick (single source of truth)
    tickOnce: () => {
      const s = get();
      if (s.lifecycle !== 'running') return;

      // 1) advance time first (so "tick 1" logic runs when tick becomes 1)
      const nextTime = applyTimeTick({ tick: s.tick, day: s.day });
      const nextTick = nextTime.tick;

      const visitorsBefore = s.visitors.length;

      // 2) spawn for THIS tick (and charge admission)
      if (shouldSpawnFakeVisitor(nextTick)) {
        get().spawnVisitor(); // also charge admission
      }

      // 3) spending: only visitors that existed BEFORE this tick
      const moneyAfterSpend = get().money + visitorsBefore * MONEY_PER_VISITOR_PER_TICK;

      set({
        ...nextTime,
        money: moneyAfterSpend,
      });
    },

    spawnVisitor: () => {
      const s = get();
      if (s.lifecycle !== 'running') return;

      const id = s.nextVisitorId;
      const visitor: Visitor = { id, position: s.entrance };

      set({
        visitors: [...s.visitors, visitor],
        nextVisitorId: s.nextVisitorId + 1,
        money: s.money + ADMISSION_FEE,
      });
    },

    placeRoomAt: (x: number, y: number) => {
      const s = get();
      if (s.lifecycle !== 'running') return;

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

    // input reducer
    dispatchInput: (input: Input) => {
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
