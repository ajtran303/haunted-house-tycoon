import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { ADMISSION_FEE, ROOM_COST } from '../core/constants';
import { VISITOR_START_FEAR, VISITOR_START_HAPPINESS } from '../core/constants';
import { upkeepPerTick } from '../core/economy';
import { newGame } from '../core/newGame';
import { placeRoom } from '../core/placement';
import { shouldSpawnVisitor } from '../core/shouldSpawnVisitor';
import { applyTimeTick } from '../core/time';
import type { GameState, Lifecycle, ParkExitEvent, RoomType, Visitor } from '../core/types';
import { applyIntentRules } from '../core/visitors/applyIntentRules';
import { applyRoomEmotionEffects } from '../core/visitors/applyRoomEmotionEffects';
import { removeVisitorsByEmotionalExit } from '../core/visitors/emotionalExit';
import { decayHappiness } from '../core/visitors/emotions';
import { entranceIsStructurallyBlocked } from '../core/visitors/entranceBlocked';
import { moveVisitors } from '../core/visitors/moveVisitors';
import { totalSpendingPerTick } from '../core/visitors/spending';

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

  // speed
  setSpeed1x: () => void;
  setSpeed4x: () => void;

  // time
  tickOnce: () => void;

  // placement
  placeRoomAt: (x: number, y: number) => void;

  // input
  dispatchInput: (input: Input) => void;
};

const isVisitorAt = (visitors: Visitor[], x: number, y: number) =>
  visitors.some((v) => v.position.x === x && v.position.y === y);

export const useGameStore = create(
  subscribeWithSelector<GameState & Actions>((set, get) => ({
    ...newGame(),

    newGame: () => set(newGame()),

    // runtime/store.ts

    startRun: () =>
      set((s) => (s.lifecycle === 'paused' ? { ...s, lifecycle: 'running' as Lifecycle } : s)),

    pause: () =>
      set((s) => (s.lifecycle === 'running' ? { ...s, lifecycle: 'paused' as Lifecycle } : s)),

    resume: () =>
      set((s) => (s.lifecycle === 'paused' ? { ...s, lifecycle: 'running' as Lifecycle } : s)),

    fail: () =>
      set((s) => (s.lifecycle !== 'failed' ? { ...s, lifecycle: 'failed' as Lifecycle } : s)),

    setSpeed1x: () => set({ speed: 1 }),
    setSpeed4x: () => set({ speed: 4 }),

    // time tick (single source of truth)
    tickOnce: () => {
      set((s) => {
        if (s.lifecycle !== 'running') return s;

        // advance time first
        const nextTime = applyTimeTick({ tick: s.tick, day: s.day });
        const nextTick = nextTime.tick;

        // movement bounds
        const gridH = s.grid.length;
        const gridW = s.grid[0]?.length ?? 0;

        // Immediate fail: entrance structurally blocked by player construction
        if (s.entrance && gridW > 0 && gridH > 0) {
          if (entranceIsStructurallyBlocked(s.grid, s.entrance)) {
            return {
              ...s,
              ...nextTime,
              money: 0,
              visitors: [],
              lifecycle: 'failed',
              // (optional later) add a failure reason/toast/event
            };
          }
        }

        // get for calculating spending and decay later
        const existingIds = new Set(s.visitors.map((v) => v.id));

        // optionally spawn visitor for THIS tick (and charge admission)
        let visitors = s.visitors;
        let nextVisitorId = s.nextVisitorId;
        let money = s.money;

        if (s.entrance && shouldSpawnVisitor(nextTick)) {
          const ex = s.entrance;

          // Prevent spawning if entrance tile already has a visitor
          if (!isVisitorAt(visitors, ex.x, ex.y)) {
            const v: Visitor = {
              id: nextVisitorId,
              position: ex,
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
        }

        // set intent rules
        const withIntent = applyIntentRules(visitors, nextTick, s.exit);

        const moved =
          gridW > 0 && gridH > 0
            ? moveVisitors(withIntent, gridW, gridH, s.grid, nextTick, s.exit)
            : withIntent;

        // Apply room effects (on entry) to everyone (including newly spawned if they moved)
        const withRoomEffects = applyRoomEmotionEffects(moved, s.grid);

        // Decay happiness
        const decayed = withRoomEffects.map((v) => (existingIds.has(v.id) ? decayHappiness(v) : v));

        // Emotional exits ie. deaths
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

        let parkExitEvents = s.parkExitEvents;
        let nextParkExitEventId = s.nextParkExitEventId;

        const afterDespawn =
          exit == null
            ? afterEmotionalExit
            : (() => {
                const leaving = afterEmotionalExit.filter(
                  (v) => v.position.x === exit.x && v.position.y === exit.y,
                );

                if (leaving.length > 0) {
                  const newEvents: ParkExitEvent[] = leaving.map((v) => ({
                    id: nextParkExitEventId++,
                    tick: nextTick,
                    visitorId: v.id,
                    position: v.position,
                  }));

                  parkExitEvents = [...parkExitEvents, ...newEvents].slice(-200);
                }

                return afterEmotionalExit.filter(
                  (v) => !(v.position.x === exit.x && v.position.y === exit.y),
                );
              })();
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
            parkExitEvents,
            nextParkExitEventId,
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
          parkExitEvents,
          nextParkExitEventId,
        };
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

      if (!applied.result.ok) {
        set((st) => ({
          ...st,
          placementEvents: [
            ...st.placementEvents,
            {
              id: st.nextPlacementEventId,
              tick: st.tick,
              roomType: st.selectedRoomType,
              reason: applied.result.reason,
              position: { x, y },
            },
          ].slice(-50),
          nextPlacementEventId: st.nextPlacementEventId + 1,
        }));
        return; // non-blocking: game keeps running
      }

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
