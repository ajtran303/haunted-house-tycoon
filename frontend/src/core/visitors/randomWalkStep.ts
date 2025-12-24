import type { Vector } from '../types';
import { dirToDelta, rotateCCW } from './dirs';
import { preferredDir } from './preferredDir';

type Args = {
  w: number;
  h: number;
  pos: Vector;
  visitorId: number;
  tick: number;
  isBlocked: (p: Vector) => boolean;
  isWalkable: (p: Vector) => boolean;
  isPreferred?: (p: Vector) => boolean;
};

const inBounds = (w: number, h: number, p: Vector) => p.x >= 0 && p.x < w && p.y >= 0 && p.y < h;

export const randomWalkStep = (args: Args): Vector => {
  const { w, h, pos, visitorId, tick, isBlocked, isWalkable, isPreferred } = args;

  const start = preferredDir(visitorId, tick);
  const order = rotateCCW(start);

  const tryMoves = (onlyPreferred: boolean): Vector | null => {
    for (const d of order) {
      const delta = dirToDelta(d);
      const next = { x: pos.x + delta.x, y: pos.y + delta.y };

      if (!inBounds(w, h, next)) continue;
      if (!isWalkable(next)) continue;
      if (isBlocked(next)) continue;

      if (onlyPreferred) {
        if (!isPreferred) continue;
        if (!isPreferred(next)) continue;
      }

      return next;
    }
    return null;
  };

  // Preference pass first (still deterministic: same order, just filtered).
  if (isPreferred) {
    const preferred = tryMoves(true);
    if (preferred) return preferred;
  }

  const any = tryMoves(false);
  if (any) return any;

  return pos;
};
