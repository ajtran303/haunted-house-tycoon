import { entranceIsStructurallyBlocked } from '../../../src/core/visitors/entranceBlocked';
import type { Cell, Grid, Vector } from '../../../src/core/types';

const makeCell = (overrides: Partial<Cell> = {}): Cell => ({
  type: 'floor',
  occupied: false,
  roomId: null,
  roomType: null,
  ...overrides,
});

/**
 * 3x3 grid with entrance on the TOP edge at (1,0).
 * Neighbors checked:
 *   left:  (0,0)
 *   right: (2,0)
 *   down:  (1,1)
 *   up:    (1,-1) out-of-bounds
 */
const makeTopEdgeEntranceGrid3 = (args: {
  left: Cell;
  right: Cell;
  down: Cell;
  entrance?: Cell;
}): { grid: Grid; entrance: Vector } => {
  const entranceCell =
    args.entrance ?? makeCell({ occupied: true, roomType: 'parkEntry', roomId: 'parkEntry-1' });

  const grid: Grid = [
    [args.left, entranceCell, args.right],
    [makeCell(), args.down, makeCell()],
    [makeCell(), makeCell(), makeCell()],
  ];

  return { grid, entrance: { x: 1, y: 0 } };
};

/**
 * 2x2 grid with entrance on the CORNER at (0,0).
 * Neighbors checked:
 *   right: (1,0)
 *   down:  (0,1)
 *   left/up are out-of-bounds
 */
const makeCornerEntranceGrid2 = (args: {
  right: Cell;
  down: Cell;
  entrance?: Cell;
}): { grid: Grid; entrance: Vector } => {
  const entranceCell =
    args.entrance ?? makeCell({ occupied: true, roomType: 'parkEntry', roomId: 'parkEntry-1' });

  const grid: Grid = [
    [entranceCell, args.right],
    [args.down, makeCell()],
  ];

  return { grid, entrance: { x: 0, y: 0 } };
};

describe('entranceIsStructurallyBlocked', () => {
  describe('top edge (non-corner) entrance', () => {
    it('returns false when there is at least one legal first step (unoccupied floor neighbor)', () => {
      const { grid, entrance } = makeTopEdgeEntranceGrid3({
        left: makeCell({ type: 'empty' }), // illegal (non-floor)
        right: makeCell({ occupied: true, roomType: 'hallway', roomId: 'hallway-1' }), // illegal outside
        down: makeCell({ occupied: false, roomType: null }), // ✅ legal first step
      });

      expect(entranceIsStructurallyBlocked(grid, entrance)).toBe(false);
    });

    it('returns false when there is a legal occupied neighbor (has roomType and not hallway/scare)', () => {
      const { grid, entrance } = makeTopEdgeEntranceGrid3({
        left: makeCell({ type: 'empty' }), // illegal
        right: makeCell({ type: 'empty' }), // illegal
        down: makeCell({ occupied: true, roomType: 'exit', roomId: 'exit-1' }), // ✅ legal outside
      });

      expect(entranceIsStructurallyBlocked(grid, entrance)).toBe(false);
    });

    it('returns true when all in-bounds neighbors are illegal (and up is out-of-bounds)', () => {
      const { grid, entrance } = makeTopEdgeEntranceGrid3({
        left: makeCell({ type: 'empty' }), // illegal: non-floor
        right: makeCell({ occupied: true, roomType: 'hallway', roomId: 'hallway-1' }), // illegal outside
        down: makeCell({ occupied: true, roomType: 'scare', roomId: 'scare-1' }), // illegal outside
      });

      expect(entranceIsStructurallyBlocked(grid, entrance)).toBe(true);
    });

    it('treats occupied floor with missing roomType as illegal', () => {
      const { grid, entrance } = makeTopEdgeEntranceGrid3({
        left: makeCell({ occupied: true, roomType: null, roomId: 'weird-1' }), // illegal by rule
        right: makeCell({ type: 'empty' }), // illegal
        down: makeCell({ occupied: true, roomType: 'hallway', roomId: 'hallway-1' }), // illegal outside
      });

      expect(entranceIsStructurallyBlocked(grid, entrance)).toBe(true);
    });
  });

  describe('corner entrance', () => {
    it('returns true when both in-bounds neighbors are illegal (right + down), with the other two out-of-bounds', () => {
      const { grid, entrance } = makeCornerEntranceGrid2({
        right: makeCell({ occupied: true, roomType: 'hallway', roomId: 'hallway-1' }), // illegal outside
        down: makeCell({ type: 'empty' }), // illegal (non-floor)
      });

      expect(entranceIsStructurallyBlocked(grid, entrance)).toBe(true);
    });

    it('returns false when at least one in-bounds neighbor is legal (corner case)', () => {
      const { grid, entrance } = makeCornerEntranceGrid2({
        right: makeCell({ occupied: false }), // ✅ legal
        down: makeCell({ occupied: true, roomType: 'scare', roomId: 'scare-1' }), // illegal outside
      });

      expect(entranceIsStructurallyBlocked(grid, entrance)).toBe(false);
    });
  });
});
