export type Lifecycle = 'paused' | 'running' | 'failed';

// add more later, i.e hallway, room, scare, entrance, exit, etc.
export type CellType = 'empty' | 'floor';

export type Cell = {
  type: CellType;
  occupied: boolean;
  roomId: string | null;
  roomType: RoomType | null;
};

export type Grid = Cell[][];

export type Vector = { x: number; y: number };

export type VisitorIntent = 'explore' | 'exit';

export type Visitor = {
  id: number;
  position: Vector;
  prevPos: Vector | null;
  inAttraction: boolean;
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

  grid: Grid;

  visitors: Visitor[];
  nextVisitorId: number;

  entrance: Vector | null;
  exit: Vector | null;

  nextRoomId: number;
  selectedRoomType: RoomType;

  // for MVP
  staffEnabled: false;

  exitEvents: ExitEvent[];
  nextExitEventId: number;

  placementEvents: PlacementEvent[];
  nextPlacementEventId: number;
};

export type RoomType = 'entry' | 'exit' | 'hallway' | 'scare' | 'parkEntry' | 'parkExit';

export type ExitReason = 'panic' | 'misery';

export type ExitEvent = {
  id: number;
  tick: number;
  visitorId: number;
  reason: ExitReason;
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
