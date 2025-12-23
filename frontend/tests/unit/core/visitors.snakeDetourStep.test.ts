import type { ScanDir } from '../../../src/core/types';
import { snakeDetourStep } from '../../../src/core/visitors/snakeDetourStep';

const dir: ScanDir = 1;

describe('snakeDetourStep vertical preference', () => {
  it('top half prefers up when forward is blocked and up is free', () => {
    // h=5 => rows 0..4, mid=2
    // y=1 is top half => preferUp
    const step = snakeDetourStep({
      w: 5,
      h: 5,
      pos: { x: 0, y: 1 },
      dir,
      isBlocked: (p) => p.x === 1 && p.y === 1, // block forward (1,1)
    });

    expect(step.pos).toEqual({ x: 0, y: 0 }); // up
    expect(step.dir).toBe(1);
  });

  it('bottom half prefers down when forward is blocked and down is free', () => {
    // y=3 is bottom half => preferDown
    const step = snakeDetourStep({
      w: 5,
      h: 5,
      pos: { x: 0, y: 3 },
      dir,
      isBlocked: (p) => p.x === 1 && p.y === 3, // block forward (1,3)
    });

    expect(step.pos).toEqual({ x: 0, y: 4 }); // down
    expect(step.dir).toBe(1);
  });

  it('middle row ties prefer up (deterministic)', () => {
    // mid = 2, y=2 => preferUp (<= mid)
    const step = snakeDetourStep({
      w: 5,
      h: 5,
      pos: { x: 0, y: 2 },
      dir,
      isBlocked: (p) => p.x === 1 && p.y === 2, // block forward (1,2)
    });

    expect(step.pos).toEqual({ x: 0, y: 1 }); // up
  });
});
