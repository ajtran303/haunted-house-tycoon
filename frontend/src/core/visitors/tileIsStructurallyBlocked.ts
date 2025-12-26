import type { Grid, Vector } from '../types';

const inBounds = (w: number, h: number, p: Vector) => p.x >= 0 && p.x < w && p.y >= 0 && p.y < h;

export const tileIsStructurallyBlocked = (grid: Grid, tile: Vector): boolean => {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  if (w <= 0 || h <= 0) return false;

  // Mirror moveVisitors.ts: canStepTo(p, false)
  const canStepToOutside = (p: Vector): boolean => {
    if (!inBounds(w, h, p)) return false;

    const cell = grid[p.y]?.[p.x] ?? null;
    if (!cell) return false;

    // Non-walkable tiles block movement.
    if (cell.type !== 'floor') return false;

    // Rooms are allowed traversal targets as long as a roomType exists.
    if (cell.occupied && !cell.roomType) return false;

    const rt = cell.roomType;

    // Outside: cannot enter hallway/scare. Entry is allowed. Exit is allowed like normal.
    if (rt === 'hallway' || rt === 'scare') return false;

    return true;
  };

  const neighbors: Vector[] = [
    { x: tile.x + 1, y: tile.y },
    { x: tile.x - 1, y: tile.y },
    { x: tile.x, y: tile.y + 1 },
    { x: tile.x, y: tile.y - 1 },
  ];

  // “Blocked” means: no legal first step exists.
  return !neighbors.some((p) => canStepToOutside(p));
};
