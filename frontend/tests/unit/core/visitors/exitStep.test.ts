import type { Vector } from '../../../../src/core/types';
import { rotateCCW } from '../../../../src/core/visitors/dirs';
import { dirToDelta } from '../../../../src/core/visitors/dirs';
import { exitStep } from '../../../../src/core/visitors/exitStep';
import { preferredDir } from '../../../../src/core/visitors/preferredDir';

const makeWalkable = (blocked: Set<string> = new Set()) => {
  const key = (p: Vector) => `${p.x},${p.y}`;

  return {
    isWalkable: (_p: Vector) => true,
    isBlocked: (p: Vector) => blocked.has(key(p)),
  };
};

describe('exitStep', () => {
  it('returns current pos if exit is null', () => {
    const { isWalkable, isBlocked } = makeWalkable();

    const pos = { x: 1, y: 1 };
    const out = exitStep({
      w: 5,
      h: 5,
      pos,
      visitor: { id: 123 },
      tick: 10,
      exit: null,
      isWalkable,
      isBlocked,
    });

    expect(out).toEqual(pos);
  });

  it('moves to the unique neighbor that minimizes Manhattan distance', () => {
    const { isWalkable, isBlocked } = makeWalkable();

    // From (1,1) with exit at (3,1), the unique best move is Right to (2,1)
    const out = exitStep({
      w: 5,
      h: 5,
      pos: { x: 1, y: 1 },
      visitor: { id: 1 },
      tick: 0,
      exit: { x: 3, y: 1 },
      isWalkable,
      isBlocked,
    });

    expect(out).toEqual({ x: 2, y: 1 });
  });

  it('does not step onto blocked cells even if they are distance-optimal', () => {
    // Block the unique best step (2,1)
    const blocked = new Set(['2,1']);
    const { isWalkable, isBlocked } = makeWalkable(blocked);

    const out = exitStep({
      w: 5,
      h: 5,
      pos: { x: 1, y: 1 },
      visitor: { id: 1 },
      tick: 0,
      exit: { x: 3, y: 1 },
      isWalkable,
      isBlocked,
    });

    // With Right blocked, the best remaining moves will be the ones that
    // keep distance as low as possible. We don't force a specific choice here
    // except that it's not the blocked cell and is still a neighbor.
    expect(out).not.toEqual({ x: 2, y: 1 });

    const neighbors = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
    ];
    expect(neighbors).toContainEqual(out);
  });

  it('breaks ties deterministically using preferredDir + rotateCCW order', () => {
    const { isWalkable, isBlocked } = makeWalkable();

    /**
     * Construct a tie:
     * pos = (1,1), exit = (2,2)
     *
     * Neighbor Right (2,1): dist = 1
     * Neighbor Down  (1,2): dist = 1
     * Both are equally best. Tie-breaker should pick the first direction
     * in rotateCCW(preferredDir(visitorId, tick)) that matches one of these moves.
     */
    const visitorId = 42;
    const tick = 7; // bucketed in preferredDir, but still deterministic

    const pos = { x: 1, y: 1 };
    const exit = { x: 2, y: 2 };

    const out = exitStep({
      w: 5,
      h: 5,
      pos,
      visitor: { id: visitorId },
      tick,
      exit,
      isWalkable,
      isBlocked,
    });

    // Compute expected choice using the same deterministic tie-break logic:
    const start = preferredDir(visitorId, tick);
    const order = rotateCCW(start);

    const bestCandidates = [
      { x: 2, y: 1 }, // Right
      { x: 1, y: 2 }, // Down
    ];

    let expected: Vector | null = null;
    for (const d of order) {
      const delta = dirToDelta(d);
      const candidate = { x: pos.x + delta.x, y: pos.y + delta.y };
      if (bestCandidates.some((c) => c.x === candidate.x && c.y === candidate.y)) {
        expected = candidate;
        break;
      }
    }

    // Sanity: expected should be found
    expect(expected).not.toBeNull();
    expect(out).toEqual(expected);
  });

  it('returns pos when no walkable neighbors exist', () => {
    const isWalkable = (_p: Vector) => false;
    const isBlocked = (_p: Vector) => false;

    const pos = { x: 1, y: 1 };

    const out = exitStep({
      w: 3,
      h: 3,
      pos,
      visitor: { id: 1 },
      tick: 0,
      exit: { x: 2, y: 2 },
      isWalkable,
      isBlocked,
    });

    expect(out).toEqual(pos);
  });

  it('exitStep chooses a move that reduces Manhattan distance when possible', () => {
    const pos = { x: 1, y: 1 };
    const exit = { x: 4, y: 1 };

    const out = exitStep({
      w: 10,
      h: 10,
      pos,
      visitor: { id: 1 },
      tick: 0,
      exit,
      isWalkable: () => true,
      isBlocked: () => false,
    });

    const d0 = Math.abs(pos.x - exit.x) + Math.abs(pos.y - exit.y);
    const d1 = Math.abs(out.x - exit.x) + Math.abs(out.y - exit.y);

    expect(d1).toBeLessThan(d0);
  });
});
