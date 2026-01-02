import { GRID_HEIGHT, GRID_WIDTH, START_DAY, START_TICK, STARTING_MONEY } from './constants';
import { createGrid } from './grid';
import type { GameState } from './types';

export const newGame = (): GameState => ({
  lifecycle: 'paused',

  speed: 1,

  day: START_DAY,
  tick: START_TICK,

  money: STARTING_MONEY,

  midwayGrid: createGrid(GRID_WIDTH, GRID_HEIGHT),
  attractions: {},

  currentView: { type: 'midway' },

  visitors: [],
  nextVisitorId: 1,

  entrance: null,
  exit: null,

  nextRoomId: 1,
  selectedRoomType: 'parkEntry',

  staffHired: 0,
  staffAssignments: {},

  exitEvents: [],
  nextExitEventId: 1,
  deathWarningTicks: 0,

  parkExitEvents: [],
  nextParkExitEventId: 1,

  placementEvents: [],
  nextPlacementEventId: 1,

  highlightedCell: null,

  targetAttractionId: null,

  failureSummary: null,
});
