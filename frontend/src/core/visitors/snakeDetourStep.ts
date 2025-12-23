import type { ScanDir, Vector } from '../types';

export type Step = { pos: Vector; dir: ScanDir };

type Args = {
  w: number;
  h: number;
  pos: Vector;
  dir: ScanDir;
  isBlocked: (p: Vector) => boolean;
};

const inBounds = (w: number, h: number, p: Vector) => p.x >= 0 && p.x < w && p.y >= 0 && p.y < h;

export const snakeDetourStep = (args: Args): Step => {
  const { w, h, pos, dir, isBlocked } = args;

  const forward: Vector = { x: pos.x + dir, y: pos.y };
  const up: Vector = { x: pos.x, y: pos.y - 1 };
  const down: Vector = { x: pos.x, y: pos.y + 1 };
  const back: Vector = { x: pos.x - dir, y: pos.y };

  const mid = (h - 1) / 2;
  const preferUp = pos.y <= mid;

  const verticalFirst = preferUp ? up : down;
  const verticalSecond = preferUp ? down : up;

  const candidates: Array<{ pos: Vector; dir: ScanDir }> = [
    { pos: forward, dir },
    { pos: verticalFirst, dir },
    { pos: verticalSecond, dir },
    { pos: back, dir: (dir * -1) as ScanDir },
  ];

  for (const c of candidates) {
    if (!inBounds(w, h, c.pos)) continue;
    if (isBlocked(c.pos)) continue;
    return c;
  }

  return { pos, dir };
};
