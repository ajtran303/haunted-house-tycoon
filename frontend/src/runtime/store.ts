import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import {
  ADMISSION_FEE,
  DEATH_SPIKE_THRESHOLD,
  DEATH_SPIKE_WINDOW_TICKS,
  MAX_DAY,
  MAX_VISITORS,
  ROOM_COST,
  SHUTDOWN_WARNING_TICKS,
  STAR_DEATH_THRESHOLD,
  STAR_HAPPY_THRESHOLD,
  STAR_VISITORS_THRESHOLD,
} from '../core/constants';
import { VISITOR_START_FEAR, VISITOR_START_HAPPINESS } from '../core/constants';
import { totalUpkeepPerTick } from '../core/economy';
import { createAttractionGrid } from '../core/grid';
import { newGame } from '../core/newGame';
import { placeRoom } from '../core/placement';
import { shouldSpawnVisitor } from '../core/shouldSpawnVisitor';
import {
  assignStaffToAttraction as applyAssignStaff,
  fireStaff as applyFireStaff,
  hireStaff as applyHireStaff,
  unassignStaffFromAttraction as applyUnassignStaff,
} from '../core/staff';
import { applyTimeTick } from '../core/time';
import type {
  AttractionGrid,
  FailureCause,
  FailureSummary,
  GameState,
  Lifecycle,
  ParkExitEvent,
  RoomType,
  SuccessSummary,
  Visitor,
} from '../core/types';
import { calculateAmenityPurchases } from '../core/visitors/amenityPurchases';
import { applyIntentRules } from '../core/visitors/applyIntentRules';
import { applyRoomEmotionEffects } from '../core/visitors/applyRoomEmotionEffects';
import { removeVisitorsByEmotionalExit } from '../core/visitors/emotionalExit';
import { decayHappiness, recoverFear } from '../core/visitors/emotions';
import { moveVisitorsMultiGrid } from '../core/visitors/moveVisitorsMultiGrid';
import { totalSpendingPerTick } from '../core/visitors/spending';
import { tileIsStructurallyBlocked } from '../core/visitors/tileIsStructurallyBlocked';
import { DEV_MODE } from '../dev/devMode';

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
  setSpeed2x: () => void;
  setSpeed4x: () => void;
  setSpeed10x: () => void;

  // time
  tickOnce: (force?: boolean) => void;

  // placement
  placeRoomAt: (x: number, y: number) => void;

  // view switching
  viewMidway: () => void;
  viewAttraction: (attractionId: string) => void;

  // attraction management
  createAttraction: (id: string, name: string, width: number, height: number) => void;

  // UI highlight
  highlightCell: (pos: { x: number; y: number }) => void;
  clearHighlight: () => void;

  // Portal targeting
  setTargetAttraction: (attractionId: string | null) => void;

  // Staff management
  hireStaff: () => void;
  fireStaff: () => void;
  assignStaff: (attractionId: string) => void;
  unassignStaff: (attractionId: string) => void;

  // input
  dispatchInput: (input: Input) => void;
};

const isVisitorAt = (visitors: Visitor[], x: number, y: number) =>
  visitors.some((v) => v.position.x === x && v.position.y === y);

const buildFailureSummary = (
  state: GameState,
  cause: FailureCause,
  activeVisitors: number,
  finalMoney: number,
): FailureSummary => {
  const WINDOW_TICKS = 60;
  const currentTick = state.tick;

  let panicDeaths = 0;
  let miseryDeaths = 0;
  let recentDeaths = 0;

  for (const e of state.exitEvents) {
    if (e.reason === 'panic') panicDeaths++;
    else if (e.reason === 'misery') miseryDeaths++;
    if (e.tick >= currentTick - WINDOW_TICKS) recentDeaths++;
  }

  let recentParkExits = 0;
  for (let i = state.parkExitEvents.length - 1; i >= 0; i--) {
    const evt = state.parkExitEvents[i];
    if (!evt || evt.tick < currentTick - WINDOW_TICKS) break;
    recentParkExits++;
  }

  return {
    cause,
    finalMoney,
    activeVisitorsAtFail: activeVisitors,
    lifetimeVisitors: state.nextVisitorId - 1,
    totalDeaths: panicDeaths + miseryDeaths,
    panicDeaths,
    miseryDeaths,
    daysFailed: state.day,
    tickFailed: currentTick,
    recentParkExits,
    recentDeaths,
    deathWarningTicks: state.deathWarningTicks,
  };
};

const buildSuccessSummary = (state: GameState): SuccessSummary => {
  const visitorsServed = state.parkExitEvents.length;
  const totalDeaths = state.exitEvents.length;

  // Calculate average exit mood
  const avgExitMood =
    visitorsServed > 0
      ? state.parkExitEvents.reduce((sum, e) => sum + e.happiness, 0) / visitorsServed
      : 0;

  const attractionsBuilt = Object.keys(state.attractions).length;

  // Calculate star rating (cumulative criteria)
  let starRating = 1; // Survived to day 31
  if (state.money > 0) starRating++; // Positive money
  if (totalDeaths < STAR_DEATH_THRESHOLD) starRating++; // Few deaths
  if (avgExitMood >= STAR_HAPPY_THRESHOLD) starRating++; // Happy visitors
  if (visitorsServed >= STAR_VISITORS_THRESHOLD) starRating++; // Many visitors served

  return {
    finalDay: state.day,
    finalMoney: state.money,
    totalRevenue: state.totalRevenue,
    visitorsServed,
    totalDeaths,
    avgExitMood: Math.round(avgExitMood),
    attractionsBuilt,
    starRating,
  };
};

export const useGameStore = create(
  subscribeWithSelector<GameState & Actions>((set, get) => ({
    ...newGame(),

    newGame: () => set(newGame()),

    // runtime/store.ts

    startRun: () =>
      set((s) =>
        s.lifecycle === 'paused' || s.lifecycle === 'title'
          ? { ...s, lifecycle: 'running' as Lifecycle }
          : s,
      ),

    pause: () =>
      set((s) => (s.lifecycle === 'running' ? { ...s, lifecycle: 'paused' as Lifecycle } : s)),

    resume: () =>
      set((s) => (s.lifecycle === 'paused' ? { ...s, lifecycle: 'running' as Lifecycle } : s)),

    fail: () =>
      set((s) => (s.lifecycle !== 'failed' ? { ...s, lifecycle: 'failed' as Lifecycle } : s)),

    setSpeed1x: () => set({ speed: 1 }),
    setSpeed2x: () => set({ speed: 2 }),
    setSpeed4x: () => set({ speed: 4 }),
    setSpeed10x: () => set({ speed: 10 }),

    // time tick (single source of truth)
    tickOnce: (force?: boolean) => {
      set((s) => {
        if (s.lifecycle !== 'running' && !force) return s;

        // advance time first
        const nextTime = applyTimeTick({ tick: s.tick, day: s.day });
        const nextTick = nextTime.tick;

        // movement bounds (midway grid for entrance/exit checks)
        const gridH = s.midwayGrid.length;
        const gridW = s.midwayGrid[0]?.length ?? 0;

        // Immediate fail: entrance structurally blocked by player construction
        if (s.entrance && gridW > 0 && gridH > 0) {
          if (tileIsStructurallyBlocked(s.midwayGrid, s.entrance)) {
            return {
              ...s,
              ...nextTime,
              money: 0,
              visitors: [],
              lifecycle: 'failed',
              failureSummary: buildFailureSummary(s, 'structural', s.visitors.length, s.money),
            };
          }
        }

        // Immediate fail: exit structurally blocked by player construction
        if (s.exit && gridW > 0 && gridH > 0) {
          if (tileIsStructurallyBlocked(s.midwayGrid, s.exit)) {
            return {
              ...s,
              ...nextTime,
              money: 0,
              visitors: [],
              lifecycle: 'failed',
              failureSummary: buildFailureSummary(s, 'structural', s.visitors.length, s.money),
            };
          }
        }

        // Season complete: reached end of day 31 (Halloween)
        if (nextTime.day > MAX_DAY) {
          return {
            ...s,
            ...nextTime,
            lifecycle: 'completed',
            successSummary: buildSuccessSummary(s),
          };
        }

        // get for calculating spending and decay later
        const existingIds = new Set(s.visitors.map((v) => v.id));

        // optionally spawn visitor for THIS tick (and charge admission)
        let visitors = s.visitors;
        let nextVisitorId = s.nextVisitorId;
        let money = s.money;
        let totalRevenue = s.totalRevenue;

        if (s.entrance && shouldSpawnVisitor(nextTick) && visitors.length < MAX_VISITORS) {
          const ex = s.entrance;

          // Prevent spawning if entrance tile already has a visitor
          if (!isVisitorAt(visitors, ex.x, ex.y)) {
            const v: Visitor = {
              id: nextVisitorId,
              position: ex,
              prevPos: null,
              location: { type: 'midway' },
              returnPortalPos: null,
              fear: VISITOR_START_FEAR,
              happiness: VISITOR_START_HAPPINESS,
              intent: 'explore',
              spawnTick: nextTick,
              exploreStartTick: nextTick,
              blockingState: null,
              staffBonusApplied: false,
            };

            visitors = [...visitors, v];
            nextVisitorId += 1;
            money += ADMISSION_FEE;
            totalRevenue += ADMISSION_FEE;
          }
        }

        // set intent rules
        const withIntent = applyIntentRules(visitors, nextTick, s.exit);

        // NEW: Multi-grid movement with portal transitions
        const moved = moveVisitorsMultiGrid(withIntent, s, nextTick);

        // Amenity purchases (one-time on entry, uses mood before amenity effect)
        const amenityRevenue = calculateAmenityPurchases(moved, s.midwayGrid);
        money += amenityRevenue;
        totalRevenue += amenityRevenue;

        // Apply room effects (on entry) to everyone (including newly spawned if they moved)
        const withRoomEffects = applyRoomEmotionEffects(
          moved,
          {
            midwayGrid: s.midwayGrid,
            attractions: s.attractions,
          },
          s.staffAssignments,
        );

        // Decay happiness (midway only, handled inside decayHappiness)
        const decayed = withRoomEffects.map((v) => (existingIds.has(v.id) ? decayHappiness(v) : v));

        // Recover fear (midway only, handled inside recoverFear)
        const recovered = decayed.map((v) => (existingIds.has(v.id) ? recoverFear(v) : v));

        // Emotional exits ie. deaths
        const exitResult = removeVisitorsByEmotionalExit(recovered, nextTick, s.nextExitEventId);

        const afterEmotionalExit = exitResult.remaining;
        const exitEvents = [...s.exitEvents, ...exitResult.events].slice(-50);
        const nextExitEventId = exitResult.nextEventId;

        // Death shutdown check: count deaths in window, update warning counter
        let deathWarningTicks = s.deathWarningTicks;
        const deathsInWindow = exitEvents.filter(
          (e) => e.tick >= nextTick - DEATH_SPIKE_WINDOW_TICKS,
        ).length;

        if (deathsInWindow >= DEATH_SPIKE_THRESHOLD) {
          deathWarningTicks += 1;
        } else {
          deathWarningTicks = 0; // Reset when deaths drop below threshold
        }

        // Check for shutdown (sustained deaths)
        if (deathWarningTicks >= SHUTDOWN_WARNING_TICKS) {
          return {
            ...s,
            ...nextTime,
            visitors: [],
            nextVisitorId,
            lifecycle: 'failed',
            exitEvents,
            nextExitEventId,
            deathWarningTicks,
            failureSummary: buildFailureSummary(
              s,
              'death_shutdown',
              afterEmotionalExit.length,
              money,
            ),
          };
        }

        // spending
        const spenders = afterEmotionalExit.filter((v) => existingIds.has(v.id));
        const spendingRevenue = totalSpendingPerTick(spenders);
        money += spendingRevenue;
        totalRevenue += spendingRevenue;

        // upkeep (midway + all attractions)
        money -= totalUpkeepPerTick(s);

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
                    happiness: v.happiness,
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
            failureSummary: buildFailureSummary(s, 'bankruptcy', afterDespawn.length, money),
          };
        }

        return {
          ...s,
          ...nextTime,
          visitors: afterDespawn,
          nextVisitorId,
          money,
          totalRevenue,
          exitEvents,
          nextExitEventId,
          deathWarningTicks,
          parkExitEvents,
          nextParkExitEventId,
        };
      });
    },

    placeRoomAt: (x: number, y: number) => {
      const s = get();
      if (s.lifecycle !== 'running') return;

      const roomType = s.selectedRoomType;
      if (!roomType) return; // Nothing selected

      // Get the grid we're currently viewing/placing on
      const currentGrid =
        s.currentView.type === 'midway'
          ? s.midwayGrid
          : s.attractions[s.currentView.attractionId]?.grid;

      if (!currentGrid) return; // Safety check

      const applied = placeRoom({
        grid: currentGrid,
        x,
        y,
        roomType,
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

      // Update the appropriate grid
      if (s.currentView.type === 'midway') {
        // If placing a portal, set the portalTo field on all cells of the 2x2 portal
        let gridToSet = applied.grid;
        if (roomType === 'attractionPortal' && s.targetAttractionId) {
          gridToSet = gridToSet.map((row, rowY) =>
            row.map((cell, cellX) => {
              // Portal is 2x2, so set portalTo on cells (x,y), (x+1,y), (x,y+1), (x+1,y+1)
              if (cellX >= x && cellX <= x + 1 && rowY >= y && rowY <= y + 1) {
                return { ...cell, portalTo: s.targetAttractionId! };
              }
              return cell;
            }),
          );
        }

        // Determine if we should clear selection after placement
        // Clear for one-time placements (entry/exit/portal) and amenities
        const isAmenity =
          roomType === 'foodStall' ||
          roomType === 'giftShop' ||
          roomType === 'restroom' ||
          roomType === 'photoBooth' ||
          roomType === 'arcade' ||
          roomType === 'firstAid';
        const clearSelection =
          roomType === 'parkEntry' ||
          roomType === 'parkExit' ||
          roomType === 'attractionPortal' ||
          isAmenity;

        set({
          midwayGrid: gridToSet,
          money: applied.money,
          nextRoomId: applied.nextRoomId,
          ...(roomType === 'parkEntry' ? { entrance: { x, y } } : null),
          ...(roomType === 'parkExit' ? { exit: { x, y } } : null),
          ...(roomType === 'attractionPortal' ? { targetAttractionId: null } : null),
          ...(clearSelection ? { selectedRoomType: null } : null),
        });
      } else {
        // Update attraction grid
        const attractionId = s.currentView.attractionId;
        const clearSelection = roomType === 'entry' || roomType === 'exit';
        set((st) => ({
          ...st,
          attractions: {
            ...st.attractions,
            [attractionId]: {
              ...st.attractions[attractionId],
              grid: applied.grid,
              // Update entry/exit points when those tiles are placed
              ...(roomType === 'entry' ? { entryPoint: { x, y } } : null),
              ...(roomType === 'exit' ? { exitPoint: { x, y } } : null),
            },
          },
          money: applied.money,
          nextRoomId: applied.nextRoomId,
          ...(clearSelection ? { selectedRoomType: null } : null),
        }));
      }
    },

    // View switching (reset selected room type to avoid stale placement preview)
    viewMidway: () => set({ currentView: { type: 'midway' }, selectedRoomType: null }),

    viewAttraction: (attractionId: string) =>
      set({ currentView: { type: 'attraction', attractionId }, selectedRoomType: null }),

    // Attraction management
    createAttraction: (id: string, name: string, width: number, height: number) => {
      const s = get();
      if (s.attractions[id]) return; // Already exists

      const attraction: AttractionGrid = {
        id,
        name,
        grid: createAttractionGrid(width, height),
        entryPoint: { x: 0, y: 0 }, // Default entry at top-left
        exitPoint: { x: width - 1, y: height - 1 }, // Default exit at bottom-right
      };

      set((st) => ({
        ...st,
        attractions: {
          ...st.attractions,
          [id]: attraction,
        },
      }));
    },

    // UI highlight
    highlightCell: (pos) => set({ highlightedCell: pos }),
    clearHighlight: () => set({ highlightedCell: null }),

    // Portal targeting
    setTargetAttraction: (attractionId) => set({ targetAttractionId: attractionId }),

    // Staff management
    hireStaff: () => {
      const s = get();
      if (s.lifecycle !== 'running') return;

      const result = applyHireStaff(s);
      if (result.ok) {
        set({ staffHired: result.staffHired, money: result.money });
      }
    },

    fireStaff: () => {
      const s = get();
      if (s.lifecycle !== 'running') return;

      const result = applyFireStaff(s);
      if (result.ok) {
        set({
          staffHired: result.staffHired,
          money: result.money,
          staffAssignments: result.staffAssignments,
        });
      }
    },

    assignStaff: (attractionId: string) => {
      const s = get();
      if (s.lifecycle !== 'running') return;

      const result = applyAssignStaff(s, attractionId);
      if (result.ok) {
        set({ staffAssignments: result.staffAssignments });
      }
    },

    unassignStaff: (attractionId: string) => {
      const s = get();
      if (s.lifecycle !== 'running') return;

      const result = applyUnassignStaff(s, attractionId);
      if (result.ok) {
        set({ staffAssignments: result.staffAssignments });
      }
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

        // If no room selected and clicking on a portal, navigate to that attraction
        if (!s.selectedRoomType && s.currentView.type === 'midway') {
          const cell = s.midwayGrid[input.y]?.[input.x];
          if (cell?.roomType === 'attractionPortal' && cell.portalTo) {
            set({ currentView: { type: 'attraction', attractionId: cell.portalTo } });
            return;
          }
        }

        get().placeRoomAt(input.x, input.y);
      }
    },
  })),
);

// Expose store for console access (dev only)
if (DEV_MODE && typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__gameState = useGameStore.getState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__tick = () => useGameStore.getState().tickOnce(true);
}
