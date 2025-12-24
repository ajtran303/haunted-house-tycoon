import { VISITOR_START_FEAR, VISITOR_START_HAPPINESS } from '../../../../src/core/constants';
import { createGrid } from '../../../../src/core/grid';
import type { Visitor } from '../../../../src/core/types';

// IMPORTANT: mock the stepper so we can force collisions and make expectations exact.
jest.mock('../../../../src/core/visitors/randomWalkStep', () => ({
  randomWalkStep: jest.fn(),
}));

import { moveVisitors } from '../../../../src/core/visitors/moveVisitors';
import { randomWalkStep } from '../../../../src/core/visitors/randomWalkStep';

type Vec = { x: number; y: number };

const V = (id: number, x: number, y: number): Visitor => ({
  id,
  position: { x, y },
  prevPos: null,
  inAttraction: false,
  fear: VISITOR_START_FEAR,
  happiness: VISITOR_START_HAPPINESS,
  intent: 'explore',
  spawnTick: 0,
});

const stepMock = randomWalkStep as unknown as jest.Mock<
  Vec,
  [
    {
      w: number;
      h: number;
      pos: Vec;
      visitorId: number;
      tick: number;
      isBlocked: (p: Vec) => boolean;
      isWalkable: (p: Vec) => boolean;
    },
  ]
>;

describe('moveVisitors', () => {
  beforeEach(() => {
    stepMock.mockReset();
  });

  it('calls randomWalkStep once per visitor with visitorId + tick', () => {
    const visitors = [V(2, 0, 0), V(1, 1, 0)];
    stepMock.mockImplementation(({ pos }) => pos); // everyone stays

    const grid = createGrid(5, 5);
    moveVisitors(visitors, 5, 5, grid, 7);

    expect(stepMock).toHaveBeenCalledTimes(2);

    // called with each visitorId
    const calls = stepMock.mock.calls.map((c) => c[0]);
    expect(calls.map((c) => c.visitorId).sort((a, b) => a - b)).toEqual([1, 2]);
    expect(calls.every((c) => c.tick === 7)).toBe(true);
    expect(calls.every((c) => c.w === 5 && c.h === 5)).toBe(true);
  });

  it('preserves original visitor array order', () => {
    const visitors = [V(10, 0, 0), V(3, 1, 0), V(7, 2, 0)];

    // move everyone +1 on x
    stepMock.mockImplementation(({ pos }) => ({ x: pos.x + 1, y: pos.y }));

    const grid = createGrid(10, 10);
    const next = moveVisitors(visitors, 10, 10, grid, 1);

    expect(next.map((v) => v.id)).toEqual([10, 3, 7]); // same order
    expect(next.find((v) => v.id === 10)!.position).toEqual({ x: 1, y: 0 });
    expect(next.find((v) => v.id === 3)!.position).toEqual({ x: 2, y: 0 });
    expect(next.find((v) => v.id === 7)!.position).toEqual({ x: 3, y: 0 });
  });

  it('does not allow overlap: later visitors see earlier claims as blocked', () => {
    const visitors = [V(1, 0, 0), V(2, 2, 0)];

    // Both want to go to (1,0). First wins, second must choose fallback.
    stepMock.mockImplementation(({ visitorId, isBlocked }) => {
      const desired = { x: 1, y: 0 };
      if (!isBlocked(desired)) return desired;

      // fallback: stay
      return visitorId === 2 ? { x: 2, y: 0 } : desired;
    });

    const grid = createGrid(5, 5);
    const next = moveVisitors(visitors, 5, 5, grid, 1);

    expect(next.find((v) => v.id === 1)!.position).toEqual({ x: 1, y: 0 });
    expect(next.find((v) => v.id === 2)!.position).toEqual({ x: 2, y: 0 });

    // ensure final positions are unique
    const positions = next.map((v) => `${v.position.x},${v.position.y}`);
    expect(new Set(positions).size).toBe(2);
  });

  it('lower id claims a contested tile first (deterministic priority)', () => {
    const visitors = [V(2, 0, 0), V(1, 2, 0)]; // note: input order has id=2 first

    stepMock.mockImplementation(({ visitorId, isBlocked }) => {
      const desired = { x: 1, y: 0 };
      if (!isBlocked(desired)) return desired;

      // if blocked, stay
      return visitorId === 2 ? { x: 0, y: 0 } : { x: 2, y: 0 };
    });

    const grid = createGrid(5, 5);
    const next = moveVisitors(visitors, 5, 5, grid, 1);

    // id=1 should win the tile, regardless of input order
    expect(next.find((v) => v.id === 1)!.position).toEqual({ x: 1, y: 0 });
    expect(next.find((v) => v.id === 2)!.position).toEqual({ x: 0, y: 0 });
  });

  it('frees your own tile before stepping so "stay" is never blocked by yourself', () => {
    const visitors = [V(1, 0, 0)];

    stepMock.mockImplementation(({ pos, isBlocked }) => {
      // staying should be legal because moveVisitors temporarily removes self occupancy
      expect(isBlocked(pos)).toBe(false);
      return pos;
    });

    const grid = createGrid(5, 5);
    const next = moveVisitors(visitors, 5, 5, grid, 1);
    expect(next[0].position).toEqual({ x: 0, y: 0 });
  });

  it('determinism: same inputs + tick => same outputs', () => {
    const visitors = [V(1, 0, 0), V(2, 2, 0)];

    // deterministic behavior dependent on tick+id, but we fake it:
    stepMock.mockImplementation(({ visitorId, tick, pos }) => {
      // just a stable pseudo step for the test
      const dx = (visitorId + tick) % 2 === 0 ? 1 : 0;
      return { x: pos.x + dx, y: pos.y };
    });

    const grid = createGrid(10, 10);
    const a = moveVisitors(visitors, 10, 10, grid, 7);
    const b = moveVisitors(visitors, 10, 10, grid, 7);

    expect(a).toEqual(b);
  });

  it('different tick can yield different outputs (still deterministic)', () => {
    const visitors = [V(1, 0, 0), V(2, 2, 0)];

    stepMock.mockImplementation(({ visitorId, tick, pos }) => {
      const dx = (visitorId + tick) % 2 === 0 ? 1 : 0;
      return { x: pos.x + dx, y: pos.y };
    });

    const grid = createGrid(10, 10);
    const t7 = moveVisitors(visitors, 10, 10, grid, 7);
    const t8 = moveVisitors(visitors, 10, 10, grid, 8);

    expect(t7).not.toEqual(t8);
  });
});
