export type Lifecycle = 'stopped' | 'paused' | 'running' | 'failed';

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

export type Visitor = {
  id: number;
  position: Vector;
  prevPos: Vector | null;
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
};

export type RoomType = 'entry' | 'hallway' | 'scare' | 'parkEntry' | 'parkExit';
