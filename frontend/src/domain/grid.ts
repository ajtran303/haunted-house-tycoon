import type { Cell } from './cell';

export type Grid = Cell[][];

const defaultCell = (): Cell => ({
  type: 'empty',
  occupied: false,
  roomId: null,
});

export function createGrid(width: number, height: number): Grid {
  if (width <= 0 || height <= 0) throw new Error('Grid dimensions must be positive');
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => defaultCell()),
  );
}

export function assertInBounds(grid: Grid, x: number, y: number): void {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error('x/y must be integers');
  if (y < 0 || y >= grid.length) throw new Error('y out of bounds');
  if (x < 0 || x >= grid[0].length) throw new Error('x out of bounds');
}

export function getCell(grid: Grid, x: number, y: number): Cell {
  assertInBounds(grid, x, y);

  return grid[y][x];
}

export function setCell(grid: Grid, x: number, y: number, cell: Cell): Grid {
  assertInBounds(grid, x, y);

  const next = grid.slice(); // copy rows array
  const nextRow = grid[y].slice(); // copy target row
  nextRow[x] = cell; // replace cell
  next[y] = nextRow; // replace row
  return next;
}
