export type Lifecycle = 'title' | 'paused' | 'running' | 'failed';

// empty for attraction default, floor for midway
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

// Internal states for spatial constraints (not visible in UI, does not affect intent)
export type BlockingState =
  | 'queued-to-enter' // On midway, attempting to enter attraction but entry blocked
  | 'queued-to-return' // In attraction at exit, attempting to return to midway but blocked
  | 'trapped'; // In attraction with no possible path to exit

export type Visitor = {
  id: number;
  position: Vector;
  prevPos: Vector | null;
  location: VisitorLocation;
  returnPortalPos: Vector | null; // Portal position visitor entered from (for returning to midway)
  fear: number;
  happiness: number;
  intent: VisitorIntent;
  spawnTick: number;
  exploreStartTick: number;
  blockingState: BlockingState | null; // Spatial constraint state (null = free to move)
  staffBonusApplied: boolean; // True if staff fear bonus was applied this attraction visit
};

export type GameSpeed = 1 | 2 | 4 | 10;

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

  // Staff system
  staffHired: number;
  staffAssignments: Record<string, number>; // attractionId -> assigned staff count

  // deaths (panic/misery)
  exitEvents: ExitEvent[];
  nextExitEventId: number;
  deathWarningTicks: number; // Consecutive ticks with deaths spiking (game over at threshold)

  // real park exits
  parkExitEvents: ParkExitEvent[];
  nextParkExitEventId: number;

  placementEvents: PlacementEvent[];
  nextPlacementEventId: number;

  // UI highlight state (for portal transitions)
  highlightedCell: Vector | null;

  // Portal placement target
  targetAttractionId: string | null;

  // Failure summary (captured when game fails)
  failureSummary: FailureSummary | null;
};

export type RoomType =
  | 'entry'
  | 'exit'
  | 'hallway'
  | 'scare'
  | 'parkEntry'
  | 'parkExit'
  | 'attractionPortal'
  | 'foodStall'
  | 'giftShop'
  | 'restroom'
  | 'photoBooth'
  | 'arcade'
  | 'firstAid';

// NOTE: These are actually reasons for "deaths"
export type ExitReason = 'panic' | 'misery';

// And this is the "Death Event"
export type ExitEvent = {
  id: number;
  tick: number;
  visitorId: number;
  reason: ExitReason;
  position: Vector;
  location: VisitorLocation;
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
  | 'exit_already_exists'
  | 'not_enough_space';

export type PlacementEvent = {
  id: number;
  tick: number;
  roomType: RoomType;
  reason: PlacementFailReason;
  position: Vector;
};

export type FailureCause = 'bankruptcy' | 'structural' | 'death_shutdown';

export type FailureSummary = {
  cause: FailureCause;
  finalMoney: number;
  activeVisitorsAtFail: number;
  lifetimeVisitors: number;
  totalDeaths: number;
  panicDeaths: number;
  miseryDeaths: number;
  daysFailed: number;
  tickFailed: number;
  recentParkExits: number;
  recentDeaths: number;
  deathWarningTicks: number;
};
