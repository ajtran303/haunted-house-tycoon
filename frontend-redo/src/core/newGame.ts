import {
  ENTRANCE_X,
  ENTRANCE_Y,
  GRID_HEIGHT,
  GRID_WIDTH,
  START_DAY,
  START_TICK,
  STARTING_MONEY,
} from './constants';
import type { Cell, GameState, Grid } from './types';

const makeCell = (): Cell => ({
  type: 'floor',
  occupied: false,
  roomId: null,
});

const makeGrid = (): Grid => {
  const rows: Grid = [];

  for (let r = 0; r < GRID_HEIGHT; r++) {
    const row: Cell[] = [];

    for (let c = 0; c < GRID_WIDTH; c++) {
      row.push(makeCell());
    }

    rows.push(row);
  }

  return rows;
};

export const newGame = (): GameState => {
  return {
    lifecycle: 'paused',

    speed: 1,

    day: START_DAY,
    tick: START_TICK,

    money: STARTING_MONEY,

    grid: makeGrid(),
    visitors: [],
    nextVisitorId: 1,

    entrance: { x: ENTRANCE_X, y: ENTRANCE_Y },

    staffEnabled: false,
  };
};
