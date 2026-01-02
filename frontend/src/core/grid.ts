import type { Cell, Grid } from './types';

const createCell = (): Cell => ({
  type: 'floor',
  occupied: false,
  roomId: null,
  roomType: null,
});

const createEmptyCell = (): Cell => ({
  type: 'empty',
  occupied: false,
  roomId: null,
  roomType: null,
});

export const createGrid = (width: number, height: number): Grid => {
  if (!Number.isInteger(width) || width <= 0) throw new Error('width must be a positive integer');
  if (!Number.isInteger(height) || height <= 0)
    throw new Error('height must be a positive integer');

  const grid: Grid = [];

  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push(createCell());
    }
    grid.push(row);
  }

  return grid;
};

export const createAttractionGrid = (width: number, height: number): Grid => {
  if (!Number.isInteger(width) || width <= 0) throw new Error('width must be a positive integer');
  if (!Number.isInteger(height) || height <= 0)
    throw new Error('height must be a positive integer');

  const grid: Grid = [];

  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push(createEmptyCell());
    }
    grid.push(row);
  }

  return grid;
};
