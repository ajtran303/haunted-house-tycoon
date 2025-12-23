// src/core/visitors/snakeRetrace.ts
export type Pos = { x: number; y: number };
export type ScanDir = 1 | -1;

export const toSnakeIndex = (w: number, pos: Pos): number => {
  const { x, y } = pos;
  const rowOffset = y * w;
  const withinRow = y % 2 === 0 ? x : w - 1 - x;
  return rowOffset + withinRow;
};

export const fromSnakeIndex = (w: number, idx: number): Pos => {
  const y = Math.floor(idx / w);
  const rem = idx - y * w;
  const x = y % 2 === 0 ? rem : w - 1 - rem;
  return { x, y };
};

export const snakeStepWithRetrace = (args: {
  w: number;
  h: number;
  pos: Pos;
  dir: ScanDir; // +1 forward, -1 backward
}): { pos: Pos; dir: ScanDir } => {
  const { w, h, pos, dir } = args;
  if (w <= 0 || h <= 0) return { pos, dir };

  const max = w * h - 1;
  const idx = toSnakeIndex(w, pos);

  // If somehow out of range, clamp/no-op deterministically
  if (idx < 0 || idx > max) return { pos, dir };

  let nextDir: ScanDir = dir;
  let nextIdx = idx + dir;

  // bounce at ends
  if (nextIdx > max) {
    nextDir = -1;
    nextIdx = idx + nextDir;
  } else if (nextIdx < 0) {
    nextDir = 1;
    nextIdx = idx + nextDir;
  }

  return { pos: fromSnakeIndex(w, nextIdx), dir: nextDir };
};
