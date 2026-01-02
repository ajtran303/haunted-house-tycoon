import { useGameStore } from '../../runtime/store';

// Base cell size for the reference grid (midway at 12 tiles tall)
const BASE_CELL_SIZE = 36;
const REFERENCE_HEIGHT = 12;
const REFERENCE_WIDTH = 18;
const TARGET_PIXEL_HEIGHT = BASE_CELL_SIZE * REFERENCE_HEIGHT; // 432px

const CANVAS_WIDTH = 700;
export const GRID_ORIGIN_Y = 160; // Account for React top bar (4 rows: header, stats, emotions, deaths)

// Calculate cell size based on grid height
export const getCellSizeForHeight = (gridHeight: number): number => {
  return Math.floor(TARGET_PIXEL_HEIGHT / gridHeight);
};

// Get the current grid dimensions based on the view
const getCurrentGridDimensions = (): { width: number; height: number } => {
  const state = useGameStore.getState();
  if (state.currentView.type === 'midway') {
    return {
      width: state.midwayGrid[0]?.length ?? REFERENCE_WIDTH,
      height: state.midwayGrid.length,
    };
  }
  const attraction = state.attractions[state.currentView.attractionId];
  return {
    width: attraction?.grid[0]?.length ?? 8,
    height: attraction?.grid.length ?? REFERENCE_HEIGHT,
  };
};

// Get the current grid height based on the view
const getCurrentGridHeight = (): number => {
  return getCurrentGridDimensions().height;
};

// Get the current cell size based on the current view
export const getCurrentCellSize = (): number => {
  return getCellSizeForHeight(getCurrentGridHeight());
};

// Get centered ORIGIN_X based on current grid width
export const getCurrentOriginX = (): number => {
  const { width } = getCurrentGridDimensions();
  const cellSize = getCurrentCellSize();
  const gridPixelWidth = width * cellSize;
  return Math.floor((CANVAS_WIDTH - gridPixelWidth) / 2);
};
