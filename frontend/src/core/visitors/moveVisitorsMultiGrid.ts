/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GameState, Grid, Vector, Visitor } from '../types';
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

    const grid = getVisitorGrid(state, v);
    const gridW = grid[0]?.length ?? 0;
    const gridH = grid.length;

    const getCell = (p: Vector) => grid[p.y]?.[p.x] ?? null;
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
    const checkPortalTransition = (pos: Vector): Visitor | null => {
      if (v.location.type !== 'midway') return null;

      const cell = getCell(pos);
      if (cell?.roomType === 'attractionPortal' && cell.portalTo) {
        const attraction = state.attractions[cell.portalTo];
        if (!attraction) return null;

        // Only allow entry if attraction has both entry AND exit placed
        if (!isAttractionReady(cell.portalTo)) return null;

        return {
          ...v,
          prevPos: v.position,
          position: attraction.entryPoint,
          location: { type: 'attraction', attractionId: cell.portalTo },
          returnPortalPos: pos, // Remember where they entered from
          intent: 'explore', // Reset to explore when entering attraction
          exploreStartTick: tick,
        };
      }
      return null;
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
        // Can return to portal tile itself, or adjacent floor/parkEntry/parkExit tiles
        const rt = cell.roomType;
        if (rt === 'hallway' || rt === 'scare' || rt === 'entry' || rt === 'exit') return false;
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

      // First try the portal position itself
      if (isValidReturn(portalPos)) return portalPos;

      // Then try adjacent tiles
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
    const checkAttractionExit = (pos: Vector): Visitor | null => {
      if (v.location.type !== 'attraction') return null;

      const attraction = state.attractions[v.location.attractionId];
      if (!attraction) return null;

      // Check if at exit point
      if (pos.x === attraction.exitPoint.x && pos.y === attraction.exitPoint.y) {
        if (!v.returnPortalPos) return null; // Safety check

        const returnPos = findReturnPosition(v.returnPortalPos);
        if (!returnPos) return null; // No valid position, stay in attraction

        return {
          ...v,
          prevPos: v.position,
          position: returnPos,
          location: { type: 'midway' },
          returnPortalPos: null,
          intent: v.intent, // Keep current intent
        };
      }
      return null;
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
    const portalTransition = checkPortalTransition(nextPos);
    if (portalTransition) {
      moved.set(v.id, portalTransition);
      // Update occupation for new location
      const newLocKey = 'attraction:' + (portalTransition.location as any).attractionId;
      if (!occupied.has(newLocKey)) {
        occupied.set(newLocKey, new Set());
      }
      occupied.get(newLocKey)!.add(key(portalTransition.position));
      continue;
    }

    // Check for attraction exit
    const exitTransition = checkAttractionExit(nextPos);
    if (exitTransition) {
      moved.set(v.id, exitTransition);
      // Update occupation for midway
      if (!occupied.has('midway')) {
        occupied.set('midway', new Set());
      }
      occupied.get('midway')!.add(key(exitTransition.position));
      continue;
    }

    // Normal movement (no transition)
    occupied.get(locKey)!.add(key(nextPos));

    moved.set(v.id, {
      ...v,
      prevPos: v.position,
      position: nextPos,
    });
  }

  return visitors.map((v) => moved.get(v.id)!);
};
