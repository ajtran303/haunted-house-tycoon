import { snakeStepWithRetrace } from '../../../src/core/visitors/snakeRetrace';

describe('snake retrace', () => {
  it('moves forward along the snake path', () => {
    // 3x2 grid, start at (0,0), forward
    const r1 = snakeStepWithRetrace({ w: 3, h: 2, pos: { x: 0, y: 0 }, dir: 1 });
    expect(r1).toEqual({ pos: { x: 1, y: 0 }, dir: 1 });
  });

  it('bounces at the end and retraces', () => {
    // end of snake path in 3x2 is (0,1)
    const end = { x: 0, y: 1 };
    const r = snakeStepWithRetrace({ w: 3, h: 2, pos: end, dir: 1 });
    // should flip direction and move backward to previous cell (1,1)
    expect(r).toEqual({ pos: { x: 1, y: 1 }, dir: -1 });
  });

  it('bounces at the start and goes forward', () => {
    const start = { x: 0, y: 0 };
    const r = snakeStepWithRetrace({ w: 3, h: 2, pos: start, dir: -1 });
    expect(r).toEqual({ pos: { x: 1, y: 0 }, dir: 1 });
  });
});
