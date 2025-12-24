import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { ADMISSION_FEE, MONEY_PER_VISITOR_PER_TICK, ROOM_COST } from '../core/constants';
import { VISITOR_START_FEAR, VISITOR_START_HAPPINESS } from '../core/constants';
import { newGame } from '../core/newGame';
import { placeRoom } from '../core/placement';
import { applyTimeTick } from '../core/time';
import type { GameState, Lifecycle, RoomType, Visitor } from '../core/types';
import { moveVisitors } from '../core/visitors/moveVisitors';
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
  despawnVisitor: (id: number) => void;
  despawnVisitorsAtExit: () => void;

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
      if (s.visitors.length === 0 && s.entrance) {
        get().spawnVisitor();
      }
    },

    setSpeed1x: () => set({ speed: 1 }),
    setSpeed4x: () => set({ speed: 4 }),

    // time tick (single source of truth)
    tickOnce: () => {
      set((s) => {
        if (s.lifecycle !== 'running') return s;

        // 1) advance time first
        const nextTime = applyTimeTick({ tick: s.tick, day: s.day });
        const nextTick = nextTime.tick;

        // capture how many visitors existed BEFORE this tick (for spending rule)
        const visitorsBefore = s.visitors.length;

        // 2) optionally spawn visitor for THIS tick (and charge admission)
        let visitors = s.visitors;
        let nextVisitorId = s.nextVisitorId;
        let money = s.money;

        if (s.entrance && shouldSpawnFakeVisitor(nextTick)) {
          const v: Visitor = {
            id: nextVisitorId,
            position: s.entrance,
            prevPos: null,
            inAttraction: false,
            fear: VISITOR_START_FEAR,
            happiness: VISITOR_START_HAPPINESS,
          };
          visitors = [...visitors, v];
          nextVisitorId += 1;
          money += ADMISSION_FEE;
        }

        // 3) spending: only visitors that existed BEFORE this tick
        money += visitorsBefore * MONEY_PER_VISITOR_PER_TICK;

        // 4) movement (move everyone currently in `visitors`, including newly spawned)
        const gridH = s.grid.length;
        const gridW = s.grid[0]?.length ?? 0;

        const moved =
          gridW > 0 && gridH > 0
            ? moveVisitors(visitors, gridW, gridH, s.grid, nextTick)
            : visitors;

        // 5) despawn visitors that reach the exit
        const exit = s.exit;
        const afterDespawn =
          exit == null
            ? moved
            : moved.filter((v) => !(v.position.x === exit.x && v.position.y === exit.y));

        return {
          ...s,
          ...nextTime,
          visitors: afterDespawn,
          nextVisitorId,
          money,
        };
      });
    },

    spawnVisitor: () => {
      const s = get();
      if (s.lifecycle !== 'running' || !s.entrance) return;

      const id = s.nextVisitorId;
      const visitor: Visitor = {
        id,
        position: s.entrance,
        prevPos: null,
        inAttraction: false,
        fear: VISITOR_START_FEAR,
        happiness: VISITOR_START_HAPPINESS,
      };

      set({
        visitors: [...s.visitors, visitor],
        nextVisitorId: s.nextVisitorId + 1,
        money: s.money + ADMISSION_FEE,
      });
    },

    despawnVisitor: (id) => {
      set((s) => ({
        ...s,
        visitors: s.visitors.filter((v) => v.id !== id),
      }));
    },

    despawnVisitorsAtExit: () => {
      set((s) => {
        if (!s.exit) return s;

        const ex = s.exit;
        const nextVisitors = s.visitors.filter(
          (v) => !(v.position.x === ex.x && v.position.y === ex.y),
        );

        if (nextVisitors.length === s.visitors.length) return s;

        return { ...s, visitors: nextVisitors };
      });
    },

    placeRoomAt: (x: number, y: number) => {
      const s = get();
      if (s.lifecycle !== 'running') return;

      const roomType = s.selectedRoomType;

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
        ...(roomType === 'parkEntry' ? { entrance: { x, y } } : null),
        ...(roomType === 'parkExit' ? { exit: { x, y } } : null),
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
