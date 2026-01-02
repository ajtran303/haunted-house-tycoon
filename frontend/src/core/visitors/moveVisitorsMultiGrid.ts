/* eslint-disable @typescript-eslint/no-explicit-any */

import type { BlockingState, GameState, Grid, Vector, Visitor } from '../types';
import { chooseStepForVisitor } from './chooseStepForVisitor';
import { randomWalkStep } from './randomWalkStep';

const key = (p: Vector) => `${p.x},${p.y}`;

// For attractions (old system compatibility)
const ATTRACTION_TILES = new Set(['entry', 'hallway', 'scare', 'exit'] as const);
const TRAIL_TILES = new Set(['hallway', 'scare'] as const);

/**
 * Helper to get the grid a visitor is currently in
 */
const getVisitorGrid = (state: GameState, visitor: Visitor): Grid => {
  if (visitor.location.type === 'midway') {
    return state.midwayGrid;
  }
  const attraction = state.attractions[visitor.location.attractionId];
  if (!attraction) {
    throw new Error(`Attraction ${visitor.location.attractionId} not found`);
  }
  return attraction.grid;
};

/**
 * Move all visitors, handling both midway and attraction movement + portal transitions
 */
export const moveVisitorsMultiGrid = (
  visitors: Visitor[],
  state: GameState,
  tick: number,
): Visitor[] => {
  const sorted = [...visitors].sort((a, b) => a.id - b.id);

  // Track occupancy globally (across all grids, keyed by location + position)
  const occupied = new Map<string, Set<string>>();

  for (const v of sorted) {
    const locKey =
      v.location.type === 'midway' ? 'midway' : `attraction:${v.location.attractionId}`;
    if (!occupied.has(locKey)) {
      occupied.set(locKey, new Set());
    }
    occupied.get(locKey)!.add(key(v.position));
  }

  const moved = new Map<number, Visitor>();

  const isOccupied = (location: Visitor['location'], pos: Vector): boolean => {
    const locKey = location.type === 'midway' ? 'midway' : `attraction:${location.attractionId}`;
    return occupied.get(locKey)?.has(key(pos)) ?? false;
  };

  for (const v of sorted) {
    // Remove current position from occupied set
    const locKey =
      v.location.type === 'midway' ? 'midway' : `attraction:${v.location.attractionId}`;
    occupied.get(locKey)?.delete(key(v.position));
    occupied.get(locKey)?.delete(key(v.position));

    const grid = getVisitorGrid(state, v);
    const gridW = grid[0]?.length ?? 0;
    const gridH = grid.length;

    const getCell = (p: Vector) => grid[p.y]?.[p.x] ?? null;
    // const getMidwayCell = (p: Vector) => state.midwayGrid[p.y]?.[p.x] ?? null;
    const currentRoomType = getCell(v.position)?.roomType;

    // Check if an attraction has both entry and exit tiles placed
    const isAttractionReady = (attractionId: string): boolean => {
      const attraction = state.attractions[attractionId];
      if (!attraction) return false;

      const entryCell = attraction.grid[attraction.entryPoint.y]?.[attraction.entryPoint.x];
      const exitCell = attraction.grid[attraction.exitPoint.y]?.[attraction.exitPoint.x];

      return entryCell?.roomType === 'entry' && exitCell?.roomType === 'exit';
    };

    // Check if stepping on a portal (midway only)
    // Returns: { visitor, blocked } where blocked indicates why entry failed
    const checkPortalTransition = (
      pos: Vector,
    ): { visitor: Visitor | null; blocked: BlockingState | null } => {
      if (v.location.type !== 'midway') return { visitor: null, blocked: null };

      const cell = getCell(pos);
      if (cell?.roomType === 'attractionPortal' && cell.portalTo) {
        const attraction = state.attractions[cell.portalTo];
        if (!attraction) return { visitor: null, blocked: null };

        // Only allow entry if attraction has both entry AND exit placed
        if (!isAttractionReady(cell.portalTo)) return { visitor: null, blocked: null };

        // Check if entry point is occupied by another visitor
        const entryLoc = { type: 'attraction' as const, attractionId: cell.portalTo };
        if (isOccupied(entryLoc, attraction.entryPoint)) {
          return { visitor: null, blocked: 'queued-to-enter' };
        }

        return {
          visitor: {
            ...v,
            prevPos: v.position,
            position: attraction.entryPoint,
            location: { type: 'attraction', attractionId: cell.portalTo },
            returnPortalPos: pos, // Remember where they entered from
            intent: 'explore', // Reset to explore when entering attraction
            exploreStartTick: tick,
            blockingState: null, // Clear any blocking state on successful entry
          },
          blocked: null,
        };
      }
      return { visitor: null, blocked: null };
    };

    // Find a valid return position near the portal (up to 2 tiles away)
    const findReturnPosition = (portalPos: Vector): Vector | null => {
      const midway = state.midwayGrid;
      const midwayW = midway[0]?.length ?? 0;
      const midwayH = midway.length;

      // Check if a position is valid for returning to midway
      const isValidReturn = (p: Vector): boolean => {
        if (p.x < 0 || p.x >= midwayW || p.y < 0 || p.y >= midwayH) return false;
        const cell = midway[p.y]?.[p.x];
        if (!cell) return false;
        if (cell.type !== 'floor') return false;
        // Cannot return to attraction-only tiles or portals (would re-enter immediately)
        const rt = cell.roomType;
        if (
          rt === 'hallway' ||
          rt === 'scare' ||
          rt === 'entry' ||
          rt === 'exit' ||
          rt === 'attractionPortal'
        )
          return false;
        // Check if occupied by another visitor
        if (isOccupied({ type: 'midway' }, p)) return false;
        return true;
      };

      // Try positions at distance 1 first, then distance 2
      const offsets1 = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
      ];
      const offsets2 = [
        { x: 0, y: -2 },
        { x: 1, y: -1 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 2 },
        { x: -1, y: 1 },
        { x: -2, y: 0 },
        { x: -1, y: -1 },
      ];

      // Try adjacent tiles first
      for (const off of offsets1) {
        const p = { x: portalPos.x + off.x, y: portalPos.y + off.y };
        if (isValidReturn(p)) return p;
      }

      // Then try 2 tiles away
      for (const off of offsets2) {
        const p = { x: portalPos.x + off.x, y: portalPos.y + off.y };
        if (isValidReturn(p)) return p;
      }

      return null; // No valid position found
    };

    // Check if exiting attraction
    // Returns: { visitor, blocked } where blocked indicates why exit failed
    const checkAttractionExit = (
      pos: Vector,
    ): { visitor: Visitor | null; blocked: BlockingState | null } => {
      if (v.location.type !== 'attraction') return { visitor: null, blocked: null };

      const attraction = state.attractions[v.location.attractionId];
      if (!attraction) return { visitor: null, blocked: null };

      // Check if at exit point
      if (pos.x === attraction.exitPoint.x && pos.y === attraction.exitPoint.y) {
        if (!v.returnPortalPos) return { visitor: null, blocked: null }; // Safety check

        const returnPos = findReturnPosition(v.returnPortalPos);
        if (!returnPos) {
          // At exit but can't return to midway - queued to return
          return { visitor: null, blocked: 'queued-to-return' };
        }

        return {
          visitor: {
            ...v,
            prevPos: v.position,
            position: returnPos,
            location: { type: 'midway' },
            returnPortalPos: null,
            intent: v.intent, // Keep current intent
            blockingState: null, // Clear blocking state on successful exit
            staffBonusApplied: false, // Reset for next attraction visit
          },
          blocked: null,
        };
      }
      return { visitor: null, blocked: null };
    };

    // Determine walkability based on location
    const canStepTo = (p: Vector): boolean => {
      const cell = getCell(p);
      if (!cell) return false;
      if (cell.type !== 'floor') return false;
      if (cell.occupied && !cell.roomType) return false;

      const rt = cell.roomType;

      if (v.location.type === 'attraction') {
        // Inside attraction: only attraction tiles walkable
        return rt != null && ATTRACTION_TILES.has(rt as any);
      } else {
        // On midway: cannot enter hallway/scare directly
        if (rt === 'hallway' || rt === 'scare') return false;
        return true;
      }
    };

    // Re-check blocking state transitions before computing movement
    // If visitor was blocked, try again this tick
    if (v.blockingState === 'queued-to-enter') {
      // Visitor is on a portal tile, try to enter attraction again
      const portalResult = checkPortalTransition(v.position);
      if (portalResult.visitor) {
        moved.set(v.id, portalResult.visitor);
        const newLocKey = 'attraction:' + (portalResult.visitor.location as any).attractionId;
        if (!occupied.has(newLocKey)) {
          occupied.set(newLocKey, new Set());
        }
        occupied.get(newLocKey)!.add(key(portalResult.visitor.position));
        continue;
      }
      // Still blocked - stay in queued state
      occupied.get(locKey)!.add(key(v.position));
      moved.set(v.id, { ...v, prevPos: v.position });
      continue;
    }

    if (v.blockingState === 'queued-to-return') {
      // Visitor is at attraction exit, try to return to midway again
      const exitResult = checkAttractionExit(v.position);
      if (exitResult.visitor) {
        moved.set(v.id, exitResult.visitor);
        if (!occupied.has('midway')) {
          occupied.set('midway', new Set());
        }
        occupied.get('midway')!.add(key(exitResult.visitor.position));
        continue;
      }
      // Still blocked - stay in queued state
      occupied.get(locKey)!.add(key(v.position));
      moved.set(v.id, { ...v, prevPos: v.position });
      continue;
    }

    // Choose next position based on location
    const nextPos =
      v.location.type === 'attraction'
        ? randomWalkStep({
            w: gridW,
            h: gridH,
            pos: v.position,
            visitorId: v.id,
            tick,
            isWalkable: canStepTo,
            isBlocked: (p) => isOccupied(v.location, p),
            isPreferred: (p) => {
              const rt = getCell(p)?.roomType;
              if (!rt) return false;

              // Prefer exit when inside attraction
              if (rt === 'exit') return true;

              // From entry: prefer stepping onto trail
              if (currentRoomType === 'entry') return rt === 'hallway' || rt === 'scare';

              // From trail: prefer continuing on trail
              if (currentRoomType && TRAIL_TILES.has(currentRoomType as any)) {
                return rt === 'hallway' || rt === 'scare';
              }

              return false;
            },
          })
        : chooseStepForVisitor({
            w: gridW,
            h: gridH,
            pos: v.position,
            visitor: v,
            tick,
            exit: state.exit,
            isWalkable: canStepTo,
            isBlocked: (p) => isOccupied(v.location, p),
          });

    // Check for portal transition first
    const portalResult = checkPortalTransition(nextPos);
    if (portalResult.visitor) {
      moved.set(v.id, portalResult.visitor);
      // Update occupation for new location
      const newLocKey = 'attraction:' + (portalResult.visitor.location as any).attractionId;
      if (!occupied.has(newLocKey)) {
        occupied.set(newLocKey, new Set());
      }
      occupied.get(newLocKey)!.add(key(portalResult.visitor.position));
      continue;
    }

    // If portal entry was blocked, mark visitor as queued-to-enter
    if (portalResult.blocked === 'queued-to-enter') {
      occupied.get(locKey)!.add(key(nextPos));
      moved.set(v.id, {
        ...v,
        prevPos: v.position,
        position: nextPos,
        blockingState: 'queued-to-enter',
      });
      continue;
    }

    // Check for attraction exit
    const exitResult = checkAttractionExit(nextPos);
    if (exitResult.visitor) {
      moved.set(v.id, exitResult.visitor);
      // Update occupation for midway
      if (!occupied.has('midway')) {
        occupied.set('midway', new Set());
      }
      occupied.get('midway')!.add(key(exitResult.visitor.position));
      continue;
    }

    // If exit return was blocked, mark visitor as queued-to-return
    if (exitResult.blocked === 'queued-to-return') {
      occupied.get(locKey)!.add(key(nextPos));
      moved.set(v.id, {
        ...v,
        prevPos: v.position,
        position: nextPos,
        blockingState: 'queued-to-return',
      });
      continue;
    }

    // Check for trapped state (in attraction, couldn't move)
    const isTrapped =
      v.location.type === 'attraction' && nextPos.x === v.position.x && nextPos.y === v.position.y;

    // Normal movement (no transition)
    occupied.get(locKey)!.add(key(nextPos));

    moved.set(v.id, {
      ...v,
      prevPos: v.position,
      position: nextPos,
      blockingState: isTrapped ? 'trapped' : null,
    });
  }

  return visitors.map((v) => moved.get(v.id)!);
};
