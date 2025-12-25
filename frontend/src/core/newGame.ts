import { GRID_HEIGHT, GRID_WIDTH, START_DAY, START_TICK, STARTING_MONEY } from './constants';
import { createGrid } from './grid';
import type { GameState } from './types';

const newGameState: GameState = {
  lifecycle: 'paused',

  speed: 1,

  day: START_DAY,
  tick: START_TICK,

  money: STARTING_MONEY,

  grid: createGrid(GRID_WIDTH, GRID_HEIGHT),

  visitors: [],
  nextVisitorId: 1,

  entrance: null,
  exit: null,

  nextRoomId: 1,
  selectedRoomType: 'parkEntry',

  staffEnabled: false,

  exitEvents: [],
  nextExitEventId: 1,

  placementEvents: [],
  nextPlacementEventId: 1,
};

export const newGame = (): GameState => {
  return newGameState;
};
