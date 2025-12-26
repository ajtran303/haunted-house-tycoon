import { createAttractionGrid } from './grid';
import { AttractionGrid, GameState, Grid, Vector, Visitor } from './types';

export const createAttraction = (
  id: string,
  name: string,
  width: number,
  height: number,
  entryPoint: Vector,
  exitPoint: Vector,
): AttractionGrid => ({
  id,
  name,
  grid: createAttractionGrid(width, height),
  entryPoint,
  exitPoint,
});

export const getVisitorGrid = (state: GameState, visitor: Visitor): Grid => {
  if (visitor.location.type === 'midway') {
    return state.midwayGrid;
  }
  return state.attractions[visitor.location.attractionId].grid;
};
