import { createAttractionGrid, createGrid } from '../../src/core/grid';
import { getRoomCells } from '../../src/core/placement';
import type { GameState, Grid, RoomType, Visitor } from '../../src/core/types';

/**
 * Creates a visitor with sensible defaults. Override any field as needed.
 */
export const makeVisitor = (overrides?: Partial<Visitor>): Visitor => ({
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
  blockingState: null,
  staffBonusApplied: false,
  ...overrides,
});

/**
 * Creates a game state with sensible defaults. Override any field as needed.
 */
export const makeState = (overrides?: Partial<GameState>): GameState => ({
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
  staffHired: 0,
  staffAssignments: {},
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

/**
 * Places a room on a grid at the given position.
 * Supports multi-cell rooms (trominoes, portals) by using getRoomCells.
 */
export const placeRoom = (grid: Grid, x: number, y: number, roomType: RoomType): Grid => {
  const cells = getRoomCells(roomType);
  const cellSet = new Set(cells.map((c) => `${x + c.x},${y + c.y}`));

  return grid.map((row, rowY) =>
    row.map((cell, cellX) => {
      if (cellSet.has(`${cellX},${rowY}`)) {
        return {
          ...cell,
          type: 'floor' as const,
          occupied: true,
          roomType,
        };
      }
      return cell;
    }),
  );
};

/**
 * Places a portal on a grid at the given position, linking to an attraction.
 */
export const placePortal = (grid: Grid, x: number, y: number, attractionId: string): Grid => {
  return grid.map((row, rowY) =>
    row.map((cell, cellX) => {
      if (cellX === x && rowY === y) {
        return {
          ...cell,
          type: 'floor' as const,
          occupied: true,
          roomType: 'attractionPortal' as const,
          portalTo: attractionId,
        };
      }
      return cell;
    }),
  );
};

// Re-export grid creators for convenience
export { createAttractionGrid, createGrid };
