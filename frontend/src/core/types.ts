export type Lifecycle = 'paused' | 'running' | 'failed';

// add more later, i.e hallway, room, scare, entrance, exit, etc.
export type CellType = 'empty' | 'floor';

export type Cell = {
  type: CellType;
  occupied: boolean;
  roomId: string | null;
  roomType: RoomType | null;
  portalTo?: string; // attractionId if this is a portal tile
};

export type Grid = Cell[][];

export type AttractionGrid = {
  id: string;
  name: string;
  grid: Grid;
  entryPoint: Vector;
  exitPoint: Vector;
};

export type Vector = { x: number; y: number };

export type VisitorIntent = 'explore' | 'exit';

export type VisitorLocation = { type: 'midway' } | { type: 'attraction'; attractionId: string };

export type Visitor = {
  id: number;
  position: Vector;
  prevPos: Vector | null;
  inAttraction: boolean; // DEPRECATED: will be removed, use location instead
  location: VisitorLocation;
  returnPortalPos: Vector | null; // Portal position visitor entered from (for returning to midway)
  fear: number;
  happiness: number;
  intent: VisitorIntent;
  spawnTick: number;
  exploreStartTick: number;
};

export type GameSpeed = 1 | 4;

export type GameState = {
  lifecycle: Lifecycle;
  speed: GameSpeed;

  day: number;
  tick: number;

  money: number;

  midwayGrid: Grid;
  attractions: Record<string, AttractionGrid>;

  // UI view state
  currentView: { type: 'midway' } | { type: 'attraction'; attractionId: string };

  visitors: Visitor[];
  nextVisitorId: number;

  entrance: Vector | null;
  exit: Vector | null;

  nextRoomId: number;
  selectedRoomType: RoomType | null;

  // for MVP
  staffEnabled: false;

  // deaths (panic/misery)
  exitEvents: ExitEvent[];
  nextExitEventId: number;

  // real park exits
  parkExitEvents: ParkExitEvent[];
  nextParkExitEventId: number;

  placementEvents: PlacementEvent[];
  nextPlacementEventId: number;

  // UI highlight state (for portal transitions)
  highlightedCell: Vector | null;

  // Portal placement target
  targetAttractionId: string | null;
};

export type RoomType =
  | 'entry'
  | 'exit'
  | 'hallway'
  | 'scare'
  | 'parkEntry'
  | 'parkExit'
  | 'attractionPortal';

// NOTE: These are actually reasons for "deaths"
export type ExitReason = 'panic' | 'misery';

// And this is the "Death Event"
export type ExitEvent = {
  id: number;
  tick: number;
  visitorId: number;
  reason: ExitReason;
  position: Vector;
};

// This is actually the real exit event
export type ParkExitEvent = {
  id: number;
  tick: number;
  visitorId: number;
  position: Vector;
};

export type PlacementFailReason =
  | 'out_of_bounds'
  | 'cell_occupied'
  | 'insufficient_funds'
  | 'invalid_entrance_placement'
  | 'invalid_exit_placement'
  | 'entrance_already_exists'
  | 'exit_already_exists';

export type PlacementEvent = {
  id: number;
  tick: number;
  roomType: RoomType;
  reason: PlacementFailReason;
  position: Vector;
};
