import type { Vector } from '../types';
import { dirToDelta, rotateCCW } from './dirs';
import { preferredDir } from './preferredDir';

export type ExitArgs = {
  w: number;
  h: number;
  pos: Vector;
  visitor: { id: number };
  tick: number;
  exit: Vector | null;
  isBlocked: (p: Vector) => boolean;
  isWalkable: (p: Vector) => boolean;
};

const inBounds = (w: number, h: number, p: Vector) => p.x >= 0 && p.x < w && p.y >= 0 && p.y < h;

export const exitStep = (args: ExitArgs): Vector => {
  const { w, h, pos, visitor, tick, exit, isWalkable, isBlocked } = args;
  if (!exit) return pos;

  const neighbors = getNeighbors({ w, h, pos, isWalkable, isBlocked });
  if (neighbors.length === 0) return pos;

  const bestDist = Math.min(...neighbors.map((p) => manhattan(p, exit)));
  const best = neighbors.filter((p) => manhattan(p, exit) === bestDist);

  return tieBreakDeterministic(best, pos, visitor.id, tick);
};

const manhattan = (a: Vector, b: Vector): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

const getNeighbors = (args: {
  w: number;
  h: number;
  pos: Vector;
  isWalkable: (p: Vector) => boolean;
  isBlocked: (p: Vector) => boolean;
}): Vector[] => {
  const { w, h, pos, isWalkable, isBlocked } = args;

  const candidates: Vector[] = [
    { x: pos.x, y: pos.y - 1 }, // U
    { x: pos.x - 1, y: pos.y }, // L
    { x: pos.x, y: pos.y + 1 }, // D
    { x: pos.x + 1, y: pos.y }, // R
  ];

  return candidates.filter((p) => inBounds(w, h, p) && isWalkable(p) && !isBlocked(p));
};

const tieBreakDeterministic = (
  candidates: Vector[],
  from: Vector,
  visitorId: number,
  tick: number,
): Vector => {
  if (candidates.length === 0) return from;
  if (candidates.length === 1) return candidates[0];

  const start = preferredDir(visitorId, tick);
  const order = rotateCCW(start);

  for (const d of order) {
    const delta = dirToDelta(d);
    const p = { x: from.x + delta.x, y: from.y + delta.y };
    if (candidates.some((c) => c.x === p.x && c.y === p.y)) return p;
  }

  // deterministic fallback
  return [...candidates].sort((a, b) => a.y - b.y || a.x - b.x)[0];
};
