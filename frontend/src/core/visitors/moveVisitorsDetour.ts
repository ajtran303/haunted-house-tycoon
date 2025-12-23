// src/core/visitors/moveVisitorsDetour.ts
import type { ScanDir, Vector, Visitor } from '../types';
import { snakeDetourStep } from './snakeDetourStep';

const key = (p: Vector) => `${p.x},${p.y}`;

export const moveVisitorsDetour = (
  visitors: Visitor[],
  gridW: number,
  gridH: number,
): Visitor[] => {
  // deterministic: lower id moves first
  const sorted = [...visitors].sort((a, b) => a.id - b.id);

  // start occupancy (all current positions)
  const occupied = new Set<string>(sorted.map((v) => key(v.position)));

  const moved = new Map<number, Visitor>();

  for (const v of sorted) {
    // free your own tile temporarily (so you can “stay” without blocking yourself)
    occupied.delete(key(v.position));

    const step = snakeDetourStep({
      w: gridW,
      h: gridH,
      pos: v.position,
      dir: v.scanDir as ScanDir,
      isBlocked: (p) => occupied.has(key(p)),
    });

    // reserve destination
    occupied.add(key(step.pos));

    moved.set(v.id, {
      ...v,
      position: step.pos,
      scanDir: step.dir,
    });
  }

  // return in original order (nice for UI stability)
  const byId = moved;
  return visitors.map((v) => byId.get(v.id)!);
};
