// tests/unit/core/visitors/visitors.moveVisitorsDetour.test.ts
import type { ScanDir, Visitor } from '../../../src/core/types';
import { moveVisitorsDetour } from '../../../src/core/visitors/moveVisitorsDetour';

const V = (id: number, x: number, y: number, scanDir: ScanDir = 1): Visitor => ({
  id,
  position: { x, y },
  scanDir,
});

describe('moveVisitorsDetour (detour direction)', () => {
  it('moves forward when free', () => {
    const visitors = [V(1, 0, 2, 1)];
    const next = moveVisitorsDetour(visitors, 5, 5);

    expect(next[0].position).toEqual({ x: 1, y: 2 });
  });

  it('if forward is blocked/out-of-bounds, top half detours up first (if free)', () => {
    // Make forward impossible by using w=1 so x+dir is out of bounds.
    // h=5 => mid=2; y=1 is top half -> up-first.
    const visitors = [V(1, 0, 1, 1)];
    const next = moveVisitorsDetour(visitors, 1, 5);

    expect(next[0].position).toEqual({ x: 0, y: 0 });
  });

  it('if forward is blocked/out-of-bounds, bottom half detours down first (if free)', () => {
    // h=5 => mid=2; y=3 is bottom half -> down-first.
    const visitors = [V(1, 0, 3, 1)];
    const next = moveVisitorsDetour(visitors, 1, 5);

    expect(next[0].position).toEqual({ x: 0, y: 4 });
  });

  it('middle row ties prefer up (deterministic)', () => {
    // h=5 => mid=2; y=2 is middle => prefer up (<= mid)
    const visitors = [V(1, 0, 2, 1)];
    const next = moveVisitorsDetour(visitors, 1, 5);

    expect(next[0].position).toEqual({ x: 0, y: 1 });
  });

  it('if preferred detour direction is blocked, tries the other direction', () => {
    // Bottom half prefers down, but down is blocked by another visitor sitting there.
    // With w=1, forward is invalid; so it tries down first, sees blocked, then tries up.
    const visitors = [V(1, 0, 3, 1), V(2, 0, 4, 1)];
    const next = moveVisitorsDetour(visitors, 1, 5);

    // v1 (y=3) wants down -> (0,4) but occupied by v2, so goes up -> (0,2)
    expect(next.find((v) => v.id === 1)!.position).toEqual({ x: 0, y: 2 });

    // v2 is at bottom row (y=4); forward invalid; down invalid; up is free after v1 moved -> v2 goes up to (0,3)
    expect(next.find((v) => v.id === 2)!.position).toEqual({ x: 0, y: 3 });
  });

  it('when both detours are blocked, stays put', () => {
    // Put visitor in middle, block both up and down with other visitors.
    // w=1 => forward invalid, so only vertical detours exist.
    const visitors = [V(1, 0, 2, 1), V(2, 0, 1, 1), V(3, 0, 3, 1)];
    const next = moveVisitorsDetour(visitors, 1, 5);

    expect(next.find((v) => v.id === 1)!.position).toEqual({ x: 0, y: 2 });
  });
});
