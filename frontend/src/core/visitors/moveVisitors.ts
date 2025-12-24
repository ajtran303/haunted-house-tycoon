/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Grid, Vector, Visitor } from '../types';
import { randomWalkStep } from './randomWalkStep';

const key = (p: Vector) => `${p.x},${p.y}`;

const ATTRACTION_TILES = new Set(['entry', 'hallway', 'scare', 'exit'] as const);
const TRAIL_TILES = new Set(['hallway', 'scare'] as const);

export const moveVisitors = (
  visitors: Visitor[],
  gridW: number,
  gridH: number,
  grid: Grid,
  tick: number,
): Visitor[] => {
  const sorted = [...visitors].sort((a, b) => a.id - b.id);
  const occupied = new Set(sorted.map((v) => key(v.position)));
  const moved = new Map<number, Visitor>();

  const getCell = (p: Vector) => grid[p.y]?.[p.x] ?? null;

  const canStepTo = (p: Vector, inAttraction: boolean): boolean => {
    const cell = getCell(p);
    if (!cell) return false;

    // Non-walkable tiles block movement.
    if (cell.type !== 'floor') return false;

    // Rooms are allowed traversal targets as long as a roomType exists.
    if (cell.occupied && !cell.roomType) return false;

    const rt = cell.roomType;

    if (inAttraction) {
      // Inside: ONLY attraction tiles.
      return rt != null && ATTRACTION_TILES.has(rt as any);
    }

    // Outside: cannot enter hallway/scare. Entry is allowed. Exit is allowed like normal.
    if (rt === 'hallway' || rt === 'scare') return false;

    return true;
  };

  for (const v of sorted) {
    occupied.delete(key(v.position));

    const currentRoomType = getCell(v.position)?.roomType;

    // We do NOT auto-enter attraction just by standing on entry from spawn,
    // BUT if they step onto entry, we flip below (based on nextRoomType).
    const inAttractionNow = v.inAttraction;

    const nextPos = randomWalkStep({
      w: gridW,
      h: gridH,
      pos: v.position,
      visitorId: v.id,
      tick,
      isWalkable: (p) => canStepTo(p, inAttractionNow),
      isBlocked: (p) => occupied.has(key(p)),

      isPreferred: inAttractionNow
        ? (p) => {
            const rt = getCell(p)?.roomType;
            if (!rt) return false;

            // While inside: always prefer exit if adjacent.
            if (rt === 'exit') return true;

            // From entry: prefer stepping onto hallway/scare.
            if (currentRoomType === 'entry') return rt === 'hallway' || rt === 'scare';

            // From hallway/scare: prefer continuing on hallway/scare.
            if (currentRoomType && TRAIL_TILES.has(currentRoomType as any)) {
              return rt === 'hallway' || rt === 'scare';
            }

            return false;
          }
        : undefined,
    });

    occupied.add(key(nextPos));

    const nextRoomType = getCell(nextPos)?.roomType;

    let inAttractionNext = inAttractionNow;

    // Stepping onto entry starts attraction.
    if (!inAttractionNow && nextRoomType === 'entry') inAttractionNext = true;

    // Stepping onto exit ends attraction (if inside). Outside stepping onto exit does nothing special.
    if (inAttractionNow && nextRoomType === 'exit') inAttractionNext = false;

    moved.set(v.id, {
      ...v,
      position: nextPos,
      inAttraction: inAttractionNext,
    });
  }

  return visitors.map((v) => moved.get(v.id)!);
};
