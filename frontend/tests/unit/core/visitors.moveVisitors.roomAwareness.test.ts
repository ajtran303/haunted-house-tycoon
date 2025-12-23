import { createGrid } from '../../../src/core/grid';
import type { Grid, Visitor } from '../../../src/core/types';
import { moveVisitors } from '../../../src/core/visitors/moveVisitors';

jest.mock('../../../src/core/visitors/randomWalkStep', () => ({
  randomWalkStep: jest.fn(),
}));

import { randomWalkStep } from '../../../src/core/visitors/randomWalkStep';
const stepMock = randomWalkStep as unknown as jest.Mock;

const setCell = (grid: Grid, x: number, y: number, patch: Partial<Grid[number][number]>) => {
  grid[y][x] = { ...grid[y][x], ...patch };
};

describe('moveVisitors - attraction gating', () => {
  beforeEach(() => {
    stepMock.mockReset();
  });

  it('outside visitors treat hallway/scare as blocked by isWalkable', () => {
    const grid = createGrid(3, 3);

    const v: Visitor = { id: 1, position: { x: 1, y: 1 }, prevPos: null, inAttraction: false };

    // Right is hallway
    setCell(grid, 2, 1, {
      type: 'floor',
      occupied: true,
      roomType: 'hallway',
      roomId: 'hallway-1',
    });

    // Force the stepper to "want" the hallway, but it must be rejected by isWalkable.
    stepMock.mockImplementation(({ pos, isWalkable }: any) => {
      const desired = { x: 2, y: 1 };
      expect(isWalkable(desired)).toBe(false); // collision rule
      return pos; // stay
    });

    const moved = moveVisitors([v], 3, 3, grid, 0)[0];
    expect(moved.position).toEqual({ x: 1, y: 1 });
    expect(moved.inAttraction).toBe(false);
  });

  it('outside visitors can step onto entry and become inAttraction=true', () => {
    const grid = createGrid(3, 3);

    const v: Visitor = { id: 2, position: { x: 1, y: 1 }, prevPos: null, inAttraction: false };

    // Make entry the only walkable neighbor (in real movement).
    setCell(grid, 1, 0, { type: 'empty' });
    setCell(grid, 0, 1, { type: 'empty' });
    setCell(grid, 1, 2, { type: 'empty' });
    setCell(grid, 2, 1, { type: 'floor', occupied: true, roomType: 'entry', roomId: 'entry-1' });

    // Since randomWalkStep is mocked, we must explicitly "choose" the entry.
    stepMock.mockImplementation(({ isWalkable }: any) => {
      const desired = { x: 2, y: 1 };
      expect(isWalkable(desired)).toBe(true);
      return desired;
    });

    const moved = moveVisitors([v], 3, 3, grid, 0)[0];
    expect(moved.position).toEqual({ x: 2, y: 1 });
    expect(moved.inAttraction).toBe(true);
  });

  it('inside visitors on entry prefer stepping onto adjacent hallway/scare', () => {
    const grid = createGrid(5, 5);

    // Visitor already inside and currently on entry tile.
    const v: Visitor = { id: 3, position: { x: 2, y: 2 }, prevPos: null, inAttraction: true };
    setCell(grid, 2, 2, { type: 'floor', occupied: true, roomType: 'entry', roomId: 'entry-0' });

    // Block other neighbors so only one "good" candidate exists.
    setCell(grid, 1, 2, { type: 'empty' });
    setCell(grid, 2, 1, { type: 'empty' });
    setCell(grid, 3, 2, { type: 'empty' }); // right blocked
    // Down is hallway
    setCell(grid, 2, 3, {
      type: 'floor',
      occupied: true,
      roomType: 'hallway',
      roomId: 'hallway-1',
    });

    // Since randomWalkStep is mocked, simulate the preference behavior:
    // if isPreferred says hallway is preferred, choose it.
    stepMock.mockImplementation(({ pos, isWalkable, isPreferred }: any) => {
      const desired = { x: pos.x, y: pos.y + 1 }; // (2,3)
      expect(isWalkable(desired)).toBe(true);
      expect(typeof isPreferred).toBe('function');
      expect(isPreferred(desired)).toBe(true);
      return desired;
    });

    const moved = moveVisitors([v], 5, 5, grid, 0)[0];
    expect(moved.position).toEqual({ x: 2, y: 3 });
    expect(moved.inAttraction).toBe(true);
  });
});
