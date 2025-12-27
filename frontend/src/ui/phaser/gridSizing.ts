import { useGameStore } from '../../runtime/store';

// Base cell size for the reference grid (midway at 12 tiles tall)
const BASE_CELL_SIZE = 36;
const REFERENCE_HEIGHT = 12;
const TARGET_PIXEL_HEIGHT = BASE_CELL_SIZE * REFERENCE_HEIGHT; // 432px

export const GRID_ORIGIN_X = 20;
export const GRID_ORIGIN_Y = 160; // Account for React top bar (4 rows: header, stats, emotions, deaths)

// Calculate cell size based on grid height
export const getCellSizeForHeight = (gridHeight: number): number => {
  return Math.floor(TARGET_PIXEL_HEIGHT / gridHeight);
};

// Get the current grid height based on the view
export const getCurrentGridHeight = (): number => {
  const state = useGameStore.getState();
  if (state.currentView.type === 'midway') {
    return state.midwayGrid.length;
  }
  const attraction = state.attractions[state.currentView.attractionId];
  return attraction?.grid.length ?? REFERENCE_HEIGHT;
};

// Get the current cell size based on the current view
export const getCurrentCellSize = (): number => {
  return getCellSizeForHeight(getCurrentGridHeight());
};
