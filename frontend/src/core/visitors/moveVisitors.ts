import type { Vector, Visitor } from '../types';
import { randomWalkStep } from './randomWalkStep';

const key = (p: Vector) => `${p.x},${p.y}`;

export const moveVisitors = (
  visitors: Visitor[],
  gridW: number,
  gridH: number,
  tick: number,
): Visitor[] => {
  // deterministic resolution order
  const sorted = [...visitors].sort((a, b) => a.id - b.id);

  // current occupancy
  const occupied = new Set(sorted.map((v) => key(v.position)));

  const moved = new Map<number, Visitor>();

  for (const v of sorted) {
    // free your own tile temporarily
    occupied.delete(key(v.position));

    const nextPos = randomWalkStep({
      w: gridW,
      h: gridH,
      pos: v.position,
      visitorId: v.id,
      tick,
      isBlocked: (p) => occupied.has(key(p)),
    });

    // reserve destination
    occupied.add(key(nextPos));

    moved.set(v.id, {
      ...v,
      position: nextPos,
      // scanDir can stay as-is for now
    });
  }

  // preserve original ordering
  return visitors.map((v) => moved.get(v.id)!);
};
