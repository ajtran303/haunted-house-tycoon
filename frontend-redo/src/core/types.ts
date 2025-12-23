export type Lifecycle = 'stopped' | 'paused' | 'running' | 'failed';

// minimal for now; extend later
export type CellType = 'empty' | 'floor';

export type Cell = {
  type: CellType;
  occupied: boolean;
  roomId: string | null;
};

export type Grid = Cell[][];

export type Vector = { x: number; y: number };

export type Visitor = {
  id: number;
  position: Vector;
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

  entrance: Vector;

  // for MVP
  staffEnabled: false;
};
