import type { Grid, Visitor } from '../../../../src/core/types';
import { moveVisitors } from '../../../../src/core/visitors/moveVisitors';

const makeGrid = (): Grid => [
  [
    { type: 'floor', occupied: false, roomType: null, roomId: null },
    { type: 'floor', occupied: false, roomType: null, roomId: null },
  ],
];

describe('moveVisitors prevPos behavior', () => {
  it('sets prevPos on every tick, even if visitor does not move', () => {
    const grid = makeGrid();

    const visitor: Visitor = {
      id: 1,
      position: { x: 0, y: 0 },
      prevPos: null,
      inAttraction: false,
      fear: 0,
      happiness: 50,
      intent: 'exit',
      spawnTick: 1,
    };

    const result = moveVisitors(
      [visitor],
      2,
      1,
      grid,
      1, // tick
    );

    const v = result[0];

    // prevPos should be populated
    expect(v.prevPos).not.toBeNull();
    expect(v.prevPos).toEqual({ x: 0, y: 0 });
  });

  it('updates prevPos to last position when visitor moves', () => {
    const grid = makeGrid();

    const visitor: Visitor = {
      id: 1,
      position: { x: 0, y: 0 },
      prevPos: null,
      inAttraction: false,
      fear: 0,
      happiness: 50,
      intent: 'exit',
      spawnTick: 1,
    };

    const afterFirst = moveVisitors([visitor], 2, 1, grid, 1)[0];
    const afterSecond = moveVisitors([afterFirst], 2, 1, grid, 2)[0];

    expect(afterSecond.prevPos).toEqual(afterFirst.position);
  });
});
