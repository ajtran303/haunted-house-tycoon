import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { ADMISSION_FEE, ROOM_COST } from '../core/constants';
import { VISITOR_START_FEAR, VISITOR_START_HAPPINESS } from '../core/constants';
import { upkeepPerTick } from '../core/economy';
import { newGame } from '../core/newGame';
import { placeRoom } from '../core/placement';
import { applyTimeTick } from '../core/time';
import type { GameState, Lifecycle, RoomType, Visitor } from '../core/types';
import { applyIntentRules } from '../core/visitors/applyIntentRules';
import { applyRoomEmotionEffects } from '../core/visitors/applyRoomEmotionEffects';
import { removeVisitorsByEmotionalExit } from '../core/visitors/emotionalExit';
import { decayHappiness } from '../core/visitors/emotions';
import { moveVisitors } from '../core/visitors/moveVisitors';
import { totalSpendingPerTick } from '../core/visitors/spending';
import { shouldSpawnFakeVisitor } from '../core/visitorsFake';

type Input =
  | { type: 'selectRoomType'; roomType: RoomType }
  | { type: 'clickCell'; x: number; y: number };

type Actions = {
  // lifecycle
  newGame: () => void;
  startRun: () => void;
  pause: () => void;
  resume: () => void;
  fail: () => void;

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

    // runtime/store.ts

    startRun: () => set((s) => (s.lifecycle === 'paused' ? { ...s, lifecycle: 'running' } : s)),

    pause: () => set((s) => (s.lifecycle === 'running' ? { ...s, lifecycle: 'paused' } : s)),

    resume: () => set((s) => (s.lifecycle === 'paused' ? { ...s, lifecycle: 'running' } : s)),

    fail: () => set((s) => (s.lifecycle !== 'failed' ? { ...s, lifecycle: 'failed' } : s)),

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

        // advance time first
        const nextTime = applyTimeTick({ tick: s.tick, day: s.day });
        const nextTick = nextTime.tick;

        // get for calculating spending and decay later
        const existingIds = new Set(s.visitors.map((v) => v.id));

        // optionally spawn visitor for THIS tick (and charge admission)
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
            intent: 'explore',
            spawnTick: nextTick,
            exploreStartTick: nextTick,
          };
          visitors = [...visitors, v];
          nextVisitorId += 1;
          money += ADMISSION_FEE;
        }

        // set intent rules
        const withIntent = applyIntentRules(visitors, nextTick, s.exit);

        // movement (move everyone currently on the grid, including newly spawned)
        const gridH = s.grid.length;
        const gridW = s.grid[0]?.length ?? 0;

        const moved =
          gridW > 0 && gridH > 0
            ? moveVisitors(withIntent, gridW, gridH, s.grid, nextTick, s.exit)
            : withIntent;

        // Apply room effects (on entry) to everyone (including newly spawned if they moved)
        const withRoomEffects = applyRoomEmotionEffects(moved, s.grid);

        // Decay happiness
        const decayed = withRoomEffects.map((v) => (existingIds.has(v.id) ? decayHappiness(v) : v));

        // Emotional exits
        const exitResult = removeVisitorsByEmotionalExit(decayed, nextTick, s.nextExitEventId);

        const afterEmotionalExit = exitResult.remaining;
        const exitEvents = [...s.exitEvents, ...exitResult.events].slice(-50);
        const nextExitEventId = exitResult.nextEventId;

        // spending
        const spenders = afterEmotionalExit.filter((v) => existingIds.has(v.id));
        money += totalSpendingPerTick(spenders);

        // upkeep
        money -= upkeepPerTick(s.grid);

        // despawn visitors that reach the exit
        const exit = s.exit;
        const afterDespawn =
          exit == null
            ? afterEmotionalExit
            : afterEmotionalExit.filter(
                (v) => !(v.position.x === exit.x && v.position.y === exit.y),
              );

        // check for bankruptcy
        if (money <= 0) {
          return {
            ...s,
            ...nextTime,
            money: 0,
            visitors: [],
            nextVisitorId,
            lifecycle: 'failed',
            exitEvents,
            nextExitEventId,
          };
        }

        return {
          ...s,
          ...nextTime,
          visitors: afterDespawn,
          nextVisitorId,
          money,
          exitEvents,
          nextExitEventId,
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
        intent: 'explore',
        spawnTick: s.tick,
        exploreStartTick: s.tick,
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
