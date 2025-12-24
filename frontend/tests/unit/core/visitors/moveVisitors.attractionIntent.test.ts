import { VISITOR_START_FEAR, VISITOR_START_HAPPINESS } from '../../../../src/core/constants';
import { createGrid } from '../../../../src/core/grid';
import type { Grid, Visitor } from '../../../../src/core/types';

// Mock stepper so we can force exact movement
jest.mock('../../../../src/core/visitors/randomWalkStep', () => ({
  randomWalkStep: jest.fn(),
}));

import { moveVisitors } from '../../../../src/core/visitors/moveVisitors';
import { randomWalkStep } from '../../../../src/core/visitors/randomWalkStep';

type Vec = { x: number; y: number };

const setRoom = (
  grid: Grid,
  x: number,
  y: number,
  roomType: 'entry' | 'exit' | 'hallway' | 'scare',
) => {
  const c = grid[y]![x]!;
  grid[y]![x]! = { ...c, occupied: true, roomType, roomId: `${roomType}-1` };
};

const V = (overrides: Partial<Visitor>): Visitor => ({
  id: 1,
  position: { x: 0, y: 0 },
  prevPos: null,
  inAttraction: false,
  fear: VISITOR_START_FEAR,
  happiness: VISITOR_START_HAPPINESS,
  intent: 'exit', // start as exit to prove it gets overridden
  spawnTick: 0,
  exploreStartTick: 0,
  ...overrides,
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
      isPreferred?: (p: Vec) => boolean;
    },
  ]
>;

describe('moveVisitors attraction intent rules', () => {
  beforeEach(() => {
    stepMock.mockReset();
  });

  it('on ENTER attraction: forces intent=explore and resets exploreStartTick', () => {
    // Grid: [ start ][ entry ]
    const grid = createGrid(2, 1);
    setRoom(grid, 1, 0, 'entry');

    // Force the step onto entry
    stepMock.mockImplementation(({ pos }) => {
      if (pos.x === 0 && pos.y === 0) return { x: 1, y: 0 };
      return pos;
    });

    const tick = 123;

    const visitors = [
      V({
        id: 1,
        position: { x: 0, y: 0 },
        inAttraction: false,
        intent: 'exit',
        exploreStartTick: 5,
      }),
    ];

    const next = moveVisitors(visitors, 2, 1, grid, tick, null);

    expect(next[0].position).toEqual({ x: 1, y: 0 });
    expect(next[0].inAttraction).toBe(true);

    expect(next[0].intent).toBe('explore');
    expect(next[0].exploreStartTick).toBe(tick);
  });

  it('WHILE inside attraction: forces intent=explore and does not change exploreStartTick', () => {
    // Grid: [ hallway ] (visitor is already inside)
    const grid = createGrid(2, 1);
    setRoom(grid, 0, 0, 'hallway');

    // Make them stay in place (still inside)
    stepMock.mockImplementation(({ pos }) => pos);

    const tick = 200;

    const visitors = [
      V({
        id: 1,
        position: { x: 0, y: 0 },
        inAttraction: true,
        intent: 'exit',
        exploreStartTick: 10,
      }),
    ];

    const next = moveVisitors(visitors, 2, 1, grid, tick, null);

    expect(next[0].inAttraction).toBe(true);
    expect(next[0].intent).toBe('explore');
    expect(next[0].exploreStartTick).toBe(10);
  });

  it('on EXIT attraction: intent forced to explore but exploreStartTick is NOT reset', () => {
    // Grid: [ hallway ][ exit ]
    const grid = createGrid(2, 1);
    setRoom(grid, 0, 0, 'hallway');
    setRoom(grid, 1, 0, 'exit');

    // Force the step onto attraction exit tile
    stepMock.mockImplementation(({ pos }) => {
      if (pos.x === 0 && pos.y === 0) return { x: 1, y: 0 };
      return pos;
    });

    const tick = 321;

    const visitors = [
      V({
        id: 1,
        position: { x: 0, y: 0 },
        inAttraction: true,
        intent: 'exit',
        exploreStartTick: 111,
      }),
    ];

    const next = moveVisitors(visitors, 2, 1, grid, tick, null);

    expect(next[0].position).toEqual({ x: 1, y: 0 });
    expect(next[0].inAttraction).toBe(false);

    expect(next[0].intent).toBe('explore');
    expect(next[0].exploreStartTick).toBe(111);
  });
});
