export type Lifecycle = 'stopped' | 'paused' | 'running' | 'failed';

// minimal for now; extend later
export type CellType = 'empty' | 'floor';

export type Cell = {
  type: CellType;
  occupied: boolean;
  roomId: string | null;
};

export type Grid = Cell[][];

export type Visitor = {
  id: string;
  // minimal for now; extend later
  x: number;
  y: number;
};

export type GameState = {
  lifecycle: Lifecycle;

  day: number;
  tick: number;

  money: number;

  grid: Grid;
  visitors: Visitor[];

  // for MVP
  staffEnabled: false;
};
