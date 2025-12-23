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
  const { w, h, pos, visitorId, tick, isBlocked, isPreferred } = args;

  const start = preferredDir(visitorId, tick);
  const order = rotateCCW(start); // try preferred, then CCW around

  for (const d of order) {
    const delta = dirToDelta(d);
    const next = { x: pos.x + delta.x, y: pos.y + delta.y };
    if (!inBounds(w, h, next)) continue;
    if (isBlocked(next)) continue;
    return next;
  }

  const tryOrder = (onlyPreferred: boolean): Vector | null => {
    for (const d of order) {
      const delta = dirToDelta(d);
      const next = { x: pos.x + delta.x, y: pos.y + delta.y };

      if (!inBounds(w, h, next)) continue;
      if (isBlocked(next)) continue;

      if (onlyPreferred) {
        if (!isPreferred) continue;
        if (!isPreferred(next)) continue;
      }

      return next;
    }
    return null;
  };

  if (isPreferred) {
    const preferred = tryOrder(true);
    if (preferred) return preferred;
  }

  const any = tryOrder(false);
  if (any) return any;

  return pos;
};
