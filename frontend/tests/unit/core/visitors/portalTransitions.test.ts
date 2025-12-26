import { moveVisitorsMultiGrid } from '../../../../src/core/visitors/moveVisitorsMultiGrid';
import {
  createAttractionGrid,
  createGrid,
  makeState,
  makeVisitor,
  placePortal,
  placeRoom,
} from '../../../helpers/factories';

describe('Portal Transitions', () => {
  describe('entering an attraction via portal', () => {
    it('visitor stepping on portal transitions to attraction entry point', () => {
      // Setup: attraction with entry at (0,0) and exit at (2,2)
      let attractionGrid = createAttractionGrid(3, 3);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 1, 'hallway');
      attractionGrid = placeRoom(attractionGrid, 2, 2, 'exit');

      // Midway: portal at (1,0), only valid move from (0,0) is to portal
      // Create a 2x1 corridor so visitor MUST step onto portal
      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null, // No exit so visitor explores
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Spooky Manor',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 2 },
          },
        },
      });

      // Visitor at (0,0) - only valid move is to portal at (1,0)
      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
      });

      // Move visitor - they should step onto portal and transition
      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      expect(moved[0].location).toEqual({ type: 'attraction', attractionId: 'haunt1' });
      expect(moved[0].position).toEqual({ x: 0, y: 0 }); // attraction entry point
    });

    it('records returnPortalPos when entering attraction', () => {
      let attractionGrid = createAttractionGrid(3, 3);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 2, 2, 'exit');

      // 2x1 corridor: visitor at (0,0), portal at (1,0)
      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Spooky Manor',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 2 },
          },
        },
      });

      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
        returnPortalPos: null,
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Portal was at (1,0), so returnPortalPos should be (1,0)
      expect(moved[0].returnPortalPos).toEqual({ x: 1, y: 0 });
    });

    it('resets intent to explore and exploreStartTick on portal entry', () => {
      let attractionGrid = createAttractionGrid(3, 3);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 2, 2, 'exit');

      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Spooky Manor',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 2 },
          },
        },
      });

      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
        intent: 'exit', // Was trying to exit
        exploreStartTick: 50,
      });

      const tick = 200;
      const moved = moveVisitorsMultiGrid([visitor], state, tick);

      expect(moved[0].intent).toBe('explore');
      expect(moved[0].exploreStartTick).toBe(tick);
    });
  });

  describe('attraction readiness check', () => {
    it('visitor does NOT enter portal if attraction has no entry tile', () => {
      let attractionGrid = createAttractionGrid(3, 3);
      // Only exit placed, no entry
      attractionGrid = placeRoom(attractionGrid, 2, 2, 'exit');

      // 2x1 corridor forcing visitor onto portal
      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Spooky Manor',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 2 },
          },
        },
      });

      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Should stay on midway (stepped onto portal but attraction not ready)
      expect(moved[0].location).toEqual({ type: 'midway' });
      expect(moved[0].position).toEqual({ x: 1, y: 0 }); // On the portal tile
    });

    it('visitor does NOT enter portal if attraction has no exit tile', () => {
      let attractionGrid = createAttractionGrid(3, 3);
      // Only entry placed, no exit
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');

      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Spooky Manor',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 2 },
          },
        },
      });

      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Should stay on midway
      expect(moved[0].location).toEqual({ type: 'midway' });
      expect(moved[0].position).toEqual({ x: 1, y: 0 }); // On the portal tile
    });

    it('visitor enters portal when attraction has BOTH entry and exit tiles', () => {
      let attractionGrid = createAttractionGrid(3, 3);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 2, 2, 'exit');

      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Spooky Manor',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 2 },
          },
        },
      });

      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      expect(moved[0].location).toEqual({ type: 'attraction', attractionId: 'haunt1' });
    });
  });

  describe('exiting an attraction', () => {
    it('visitor at exit point returns to midway near portal', () => {
      // 2x1 attraction: entry at (0,0), exit at (1,0) - visitor must step onto exit
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      let midwayGrid = createGrid(5, 5);
      midwayGrid = placePortal(midwayGrid, 2, 2, 'haunt1');

      const state = makeState({
        midwayGrid,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Spooky Manor',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      // Visitor inside attraction at entry, only move is to exit
      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 2, y: 2 }, // Portal position on midway
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Should be back on midway
      expect(moved[0].location).toEqual({ type: 'midway' });
      // Return position should be near portal (2,2)
      const pos = moved[0].position;
      const distFromPortal = Math.abs(pos.x - 2) + Math.abs(pos.y - 2);
      expect(distFromPortal).toBeLessThanOrEqual(2);
    });

    it('clears returnPortalPos after exiting attraction', () => {
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      let midwayGrid = createGrid(5, 5);
      midwayGrid = placePortal(midwayGrid, 2, 2, 'haunt1');

      const state = makeState({
        midwayGrid,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Spooky Manor',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      const visitor = makeVisitor({
        position: { x: 0, y: 0 }, // At entry, will step to exit
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 2, y: 2 },
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      expect(moved[0].returnPortalPos).toBeNull();
    });
  });

  describe('structural enforcement', () => {
    it('visitor inside attraction can only walk on attraction tiles', () => {
      // 3x3 grid: entry at (0,0), hallway at (1,0), exit at (2,0)
      // Empty tiles at (0,1), (1,1), (2,1) should not be walkable
      let attractionGrid = createAttractionGrid(3, 2);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'hallway');
      attractionGrid = placeRoom(attractionGrid, 2, 0, 'exit');
      // Row 1 remains empty (unwalkable)

      let midwayGrid = createGrid(5, 5);
      midwayGrid = placePortal(midwayGrid, 2, 2, 'haunt1');

      const state = makeState({
        midwayGrid,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Test',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 0 },
          },
        },
      });

      // Visitor at entry (0,0) - can only move to hallway (1,0), not down to empty (0,1)
      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 2, y: 2 },
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Should have moved along the path, not to empty tile
      expect(moved[0].position.y).toBe(0); // Stayed on row 0 (the path)
    });

    it('visitor on midway cannot walk onto hallway/scare tiles directly', () => {
      // Midway with hallway tile placed (shouldn't happen in practice, but tests the rule)
      let midwayGrid = createGrid(3, 1);
      midwayGrid = placeRoom(midwayGrid, 1, 0, 'hallway');
      midwayGrid = placeRoom(midwayGrid, 2, 0, 'parkExit');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: { x: 2, y: 0 },
      });

      // Visitor at (0,0), hallway at (1,0), exit at (2,0)
      // Should not be able to step onto hallway
      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
        intent: 'exit',
      });

      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Visitor should stay put (hallway blocks path to exit)
      expect(moved[0].position).toEqual({ x: 0, y: 0 });
    });

    it('location state is always explicit - never undefined', () => {
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      let midwayGrid = createGrid(3, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: { x: 2, y: 0 },
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Test',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
      });

      // Move multiple times
      let visitors = [visitor];
      for (let i = 0; i < 10; i++) {
        visitors = moveVisitorsMultiGrid(visitors, state, 100 + i);
        // Location should always be defined and have a valid type
        expect(visitors[0].location).toBeDefined();
        expect(['midway', 'attraction']).toContain(visitors[0].location.type);
      }
    });

    it('visitor cannot enter attraction without stepping on portal', () => {
      let attractionGrid = createAttractionGrid(2, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'exit');

      // 2x1 midway: visitor at (0,0), portal at (1,0)
      // This forces deterministic movement onto portal
      let midwayGrid = createGrid(2, 1);
      midwayGrid = placePortal(midwayGrid, 1, 0, 'haunt1');

      const state = makeState({
        midwayGrid,
        entrance: { x: 0, y: 0 },
        exit: null,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Test',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 1, y: 0 },
          },
        },
      });

      // Visitor starts at (0,0), not on portal yet
      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'midway' },
      });

      // Verify starting state - on midway, not in attraction
      expect(visitor.location).toEqual({ type: 'midway' });

      // Move: (0,0) -> (1,0) portal - enters attraction
      const moved = moveVisitorsMultiGrid([visitor], state, 100);

      // Now in attraction (had to step on portal to enter)
      expect(moved[0].location).toEqual({ type: 'attraction', attractionId: 'haunt1' });
      // Position is now at attraction entry point
      expect(moved[0].position).toEqual({ x: 0, y: 0 });
    });

    it('visitor cannot exit attraction without reaching exit point', () => {
      // 3x1 attraction: entry -> hallway -> exit
      let attractionGrid = createAttractionGrid(3, 1);
      attractionGrid = placeRoom(attractionGrid, 0, 0, 'entry');
      attractionGrid = placeRoom(attractionGrid, 1, 0, 'hallway');
      attractionGrid = placeRoom(attractionGrid, 2, 0, 'exit');

      let midwayGrid = createGrid(5, 5);
      midwayGrid = placePortal(midwayGrid, 2, 2, 'haunt1');

      const state = makeState({
        midwayGrid,
        attractions: {
          haunt1: {
            id: 'haunt1',
            name: 'Test',
            grid: attractionGrid,
            entryPoint: { x: 0, y: 0 },
            exitPoint: { x: 2, y: 0 },
          },
        },
      });

      // Visitor at entry (0,0)
      const visitor = makeVisitor({
        position: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt1' },
        returnPortalPos: { x: 2, y: 2 },
      });

      // First move: entry -> hallway (still in attraction)
      let moved = moveVisitorsMultiGrid([visitor], state, 100);
      expect(moved[0].location).toEqual({ type: 'attraction', attractionId: 'haunt1' });
      expect(moved[0].position).toEqual({ x: 1, y: 0 }); // On hallway

      // Second move: hallway -> exit (exits to midway)
      moved = moveVisitorsMultiGrid(moved, state, 101);
      expect(moved[0].location).toEqual({ type: 'midway' });
    });
  });
});
