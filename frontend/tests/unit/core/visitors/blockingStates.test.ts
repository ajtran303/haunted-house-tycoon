import { moveVisitorsMultiGrid } from '../../../../src/core/visitors/moveVisitorsMultiGrid';
import {
  createAttractionGrid,
  createGrid,
  makeState,
  makeVisitor,
  placePortal,
  placeRoom,
} from '../../../helpers/factories';

describe('Visitor Blocking States', () => {
  describe('queued-to-enter', () => {
    it('visitor enters queued-to-enter when attraction entry point is occupied', () => {
      // Setup: 2x1 midway with portal, attraction with occupied entry
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      // Another visitor already at attraction entry
      const blockerInAttraction = makeVisitor({
        id: 2,
        position: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 1, y: 0 },
      });

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Haunt',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      // Visitor trying to enter portal
      const visitor = makeVisitor({
        id: 1,
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
      });

      const moved = moveVisitorsMultiGrid([visitor, blockerInAttraction], state, 100);
      const v1 = moved.find((v) => v.id === 1)!;

      // Should be on portal tile but queued (couldn't enter)
      expect(v1.position).toEqual({ x: 1, y: 0 });
      expect(v1.location).toEqual({ type: 'midway' });
      expect(v1.blockingState).toBe('queued-to-enter');
    });

    it('queued-to-enter clears when entry becomes available', () => {
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Haunt',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      // Visitor already queued on portal
      const visitor = makeVisitor({
        id: 1,
        position: { x: 1, y: 0 }, // On portal
        location: { type: 'midway' },
        blockingState: 'queued-to-enter',
      });

      // No blocker this time - entry is free
      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      expect(moved[0].location).toEqual({ type: 'attraction', attractionId: 'haunt1' });
      expect(moved[0].blockingState).toBeNull();
    });
  });

  describe('queued-to-return', () => {
    it('visitor enters queued-to-return when midway return position is blocked', () => {
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      // 3x3 midway with portal at center, all adjacent tiles blocked by visitors
      let midwayGrid = createGrid(3, 3);
      midwayGrid = placePortal(midwayGrid, 1, 1, 'haunt1');

      // Blockers on all tiles adjacent to portal AND corners (findReturnPosition checks distance 2)
      const blockers = [
        // Cardinal neighbors (distance 1)
        makeVisitor({ id: 10, position: { x: 0, y: 1 }, location: { type: 'midway' } }),
        makeVisitor({ id: 11, position: { x: 2, y: 1 }, location: { type: 'midway' } }),
        makeVisitor({ id: 12, position: { x: 1, y: 0 }, location: { type: 'midway' } }),
        makeVisitor({ id: 13, position: { x: 1, y: 2 }, location: { type: 'midway' } }),
        // Corners (distance 2 diagonals)
        makeVisitor({ id: 14, position: { x: 0, y: 0 }, location: { type: 'midway' } }),
        makeVisitor({ id: 15, position: { x: 2, y: 0 }, location: { type: 'midway' } }),
        makeVisitor({ id: 16, position: { x: 0, y: 2 }, location: { type: 'midway' } }),
        makeVisitor({ id: 17, position: { x: 2, y: 2 }, location: { type: 'midway' } }),
      ];

      const state = makeState({
        midwayGrid,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Haunt',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      // Visitor at attraction entry, will step to exit
      const visitor = makeVisitor({
        id: 1,
        position: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 1, y: 1 },
      });

      const moved = moveVisitorsMultiGrid([visitor, ...blockers], state, 100);
      const v1 = moved.find((v) => v.id === 1)!;

      // Visitor reached exit but couldn't return to midway
      expect(v1.position).toEqual({ x: 1, y: 0 }); // At exit
      expect(v1.location).toEqual({ type: 'attraction', attractionId: 'haunt1' });
      expect(v1.blockingState).toBe('queued-to-return');
    });

    it('queued-to-return clears when return position becomes available', () => {
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      let midwayGrid = createGrid(3, 3);
      midwayGrid = placePortal(midwayGrid, 1, 1, 'haunt1');

      const state = makeState({
        midwayGrid,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Haunt',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      // Visitor queued at exit
      const visitor = makeVisitor({
        id: 1,
        position: { x: 1, y: 0 }, // At exit
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 1, y: 1 },
        blockingState: 'queued-to-return',
      });

      // No blockers - return position free
      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      expect(moved[0].location).toEqual({ type: 'midway' });
      expect(moved[0].blockingState).toBeNull();
    });
  });

  describe('trapped', () => {
    it('visitor enters trapped state when no path to exit exists', () => {
      // Attraction with entry but exit unreachable (gap in path)
      let attractionGrid = createAttractionGrid(3, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      // Gap at (1,0) - no tile placed
      attractionGrid = placeRoom(attractionGrid, 2, 0, 'exit');

      let midwayGrid = createGrid(3, 3);
      midwayGrid = placePortal(midwayGrid, 1, 1, 'haunt1');

      const state = makeState({
        midwayGrid,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Haunt',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 0 },
          },
        },
      });

      // Visitor at entry with no way to reach exit
      const visitor = makeVisitor({
        id: 1,
        position: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 1, y: 1 },
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Can't move (no valid neighbors), becomes trapped
      expect(moved[0].position).toEqual({ x: 0, y: 0 }); // Stayed put
      expect(moved[0].blockingState).toBe('trapped');
    });
  });

  describe('intent preservation', () => {
    it('queued-to-enter does not change visitor intent', () => {
      // Visitor on midway with exit intent, blocked from entering attraction
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      // Blocker at attraction entry
      const blocker = makeVisitor({
        id: 2,
        position: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 1, y: 0 },
      });

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Haunt',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      const visitor = makeVisitor({
        id: 1,
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
        intent: 'explore',
      });

      const moved = moveVisitorsMultiGrid([visitor, blocker], state, 100);
      const v1 = moved.find((v) => v.id === 1)!;

      // Intent unchanged even though queued
      expect(v1.intent).toBe('explore');
      expect(v1.blockingState).toBe('queued-to-enter');
    });

    it('trapped state preserves explore intent in attraction', () => {
      let attractionGrid = createAttractionGrid(3, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      // Gap - visitor trapped
      attractionGrid = placeRoom(attractionGrid, 2, 0, 'exit');

      let midwayGrid = createGrid(3, 3);
      midwayGrid = placePortal(midwayGrid, 1, 1, 'haunt1');

      const state = makeState({
        midwayGrid,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Haunt',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 0 },
          },
        },
      });

      const visitor = makeVisitor({
        id: 1,
        position: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 1, y: 1 },
        intent: 'explore', // Attractions always have explore intent
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Intent unchanged even though trapped
      expect(moved[0].intent).toBe('explore');
      expect(moved[0].blockingState).toBe('trapped');
    });
  });

  describe('default state', () => {
    it('blockingState is null when visitor can move freely', () => {
      const midwayGrid = createGrid(3, 3);

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: { x: 2, y: 2 },
      });

      const visitor = makeVisitor({
        position: { x: 1, y: 1 },
        location: { type: 'midway' },
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      expect(moved[0].blockingState).toBeNull();
    });
  });
});
