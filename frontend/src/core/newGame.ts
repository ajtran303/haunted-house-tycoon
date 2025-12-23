import {
  ENTRANCE_X,
  ENTRANCE_Y,
  GRID_HEIGHT,
  GRID_WIDTH,
  START_DAY,
  START_TICK,
  STARTING_MONEY,
} from './constants';
import { createGrid } from './grid';
import type { GameState } from './types';

export const newGame = (): GameState => {
  return {
    lifecycle: 'paused',

    speed: 1,

    day: START_DAY,
    tick: START_TICK,

    money: STARTING_MONEY,

    grid: createGrid(GRID_WIDTH, GRID_HEIGHT),

    visitors: [],
    nextVisitorId: 1,

    entrance: { x: ENTRANCE_X, y: ENTRANCE_Y },

    nextRoomId: 1,
    selectedRoomType: 'hallway',

    staffEnabled: false,
  };
};
