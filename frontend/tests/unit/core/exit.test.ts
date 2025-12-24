import { VISITOR_START_FEAR, VISITOR_START_HAPPINESS } from '../../../src/core/constants';
import type { Vector, Visitor } from '../../../src/core/types';
import { removeVisitorsAtExit, validateExitPlacement } from '../../../src/core/visitors/exit';

const V = (id: number, x: number, y: number, prevPos: Vector | null = null): Visitor => ({
  id,
  position: { x, y },
  prevPos,
  inAttraction: false,
  fear: VISITOR_START_FEAR,
  happiness: VISITOR_START_HAPPINESS,
});

describe('validateExitPlacement', () => {
  it('rejects non-edge placement', () => {
    const r = validateExitPlacement({ x: 2, y: 2 }, 5, 5);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_exit_placement');
  });

  it('allows edge placement (including corners)', () => {
    expect(validateExitPlacement({ x: 0, y: 3 }, 5, 5)).toEqual({ ok: true });
    expect(validateExitPlacement({ x: 4, y: 3 }, 5, 5)).toEqual({ ok: true });
    expect(validateExitPlacement({ x: 2, y: 0 }, 5, 5)).toEqual({ ok: true });
    expect(validateExitPlacement({ x: 2, y: 4 }, 5, 5)).toEqual({ ok: true });

    expect(validateExitPlacement({ x: 0, y: 0 }, 5, 5)).toEqual({ ok: true });
    expect(validateExitPlacement({ x: 4, y: 4 }, 5, 5)).toEqual({ ok: true });
  });
});

describe('removeVisitorsAtExit', () => {
  it('removes visitors whose position equals exit', () => {
    const exit: Vector = { x: 0, y: 0 };
    const visitors = [V(1, 0, 0), V(2, 1, 0), V(3, 0, 0)];

    const r = removeVisitorsAtExit(visitors, exit);

    expect(r.kept.map((v) => v.id)).toEqual([2]);
    expect(r.removedIds).toEqual([1, 3]);
  });

  it('keeps original order for survivors', () => {
    const exit: Vector = { x: 9, y: 9 };
    const visitors = [V(10, 1, 0), V(5, 2, 0), V(7, 3, 0)];

    const r = removeVisitorsAtExit(visitors, exit);

    expect(r.kept.map((v) => v.id)).toEqual([10, 5, 7]);
    expect(r.removedIds).toEqual([]);
  });

  it('does not mutate visitor objects', () => {
    const exit: Vector = { x: 0, y: 0 };
    const v2 = V(2, 1, 0, { x: 1, y: 1 });
    const visitors = [V(1, 0, 0), v2];

    const r = removeVisitorsAtExit(visitors, exit);

    expect(r.kept[0]).toBe(v2); // same reference
    expect(r.kept[0].prevPos).toEqual({ x: 1, y: 1 });
  });
});
