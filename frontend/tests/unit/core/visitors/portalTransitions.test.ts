import { createAttractionGrid, createGrid } from '../../../../src/core/grid';
import type { Cell, GameState, Grid, Visitor } from '../../../../src/core/types';
import { moveVisitorsMultiGrid } from '../../../../src/core/visitors/moveVisitorsMultiGrid';

const makeVisitor = (overrides?: Partial<Visitor>): Visitor => ({
  id: 1,
  position: { x: 0, y: 0 },
  prevPos: null,
  location: { type: 'midway' },
  returnPortalPos: null,
  fear: 0,
  happiness: 50,
  intent: 'explore',
  spawnTick: 0,
  exploreStartTick: 0,
  ...overrides,
});

const makeCell = (overrides?: Partial<Cell>): Cell => ({
  type: 'floor',
  occupied: false,
  roomId: null,
  roomType: null,
  ...overrides,
});

const makeState = (overrides?: Partial<GameState>): GameState => ({
  lifecycle: 'running',
  speed: 1,
  day: 1,
  tick: 0,
  money: 1000,
  midwayGrid: createGrid(5, 5),
  attractions: {},
  currentView: { type: 'midway' },
  visitors: [],
  nextVisitorId: 1,
  entrance: { x: 0, y: 0 },
  exit: { x: 4, y: 4 },
  nextRoomId: 1,
  selectedRoomType: null,
  staffEnabled: false,
  exitEvents: [],
  nextExitEventId: 1,
  parkExitEvents: [],
  nextParkExitEventId: 1,
  placementEvents: [],
  nextPlacementEventId: 1,
  highlightedCell: null,
  targetAttractionId: null,
  ...overrides,
});

// Helper to place a room on a grid
const placeRoom = (grid: Grid, x: number, y: number, roomType: string): Grid => {
  return grid.map((row, rowY) =>
    row.map((cell, cellX) => {
      if (cellX === x && rowY === y) {
        return { ...cell, type: 'floor' as const, roomType: roomType as Cell['roomType'] };
      }
      return cell;
    }),
  );
};

// Helper to place a portal with portalTo reference
const placePortal = (grid: Grid, x: number, y: number, attractionId: string): Grid => {
  return grid.map((row, rowY) =>
    row.map((cell, cellX) => {
      if (cellX === x && rowY === y) {
        return {
          ...cell,
          type: 'floor' as const,
          roomType: 'attractionPortal' as const,
          portalTo: attractionId,
        };
      }
      return cell;
    }),
  );
};

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
});
