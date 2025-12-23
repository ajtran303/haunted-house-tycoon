import type { Vector, Visitor } from '../types';

const isEdge = (p: Vector, w: number, h: number) =>
  p.x === 0 || p.y === 0 || p.x === w - 1 || p.y === h - 1;

export const validateExitPlacement = (pos: Vector, w: number, h: number) => {
  if (!isEdge(pos, w, h)) return { ok: false as const, reason: 'invalid_exit_placement' as const };
  return { ok: true as const };
};

export const removeVisitorsAtExit = (visitors: Visitor[], exit: Vector) => {
  const removedIds: number[] = [];
  const kept: Visitor[] = [];

  for (const v of visitors) {
    if (v.position.x === exit.x && v.position.y === exit.y) removedIds.push(v.id);
    else kept.push(v);
  }

  return { kept, removedIds };
};
