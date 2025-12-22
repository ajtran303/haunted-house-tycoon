import { describe, expect, it } from '@jest/globals';

import { createGrid, getCell, setCell } from './grid';

describe('createGrid(width, height)', () => {
  it('creates a grid with correct dimensions', () => {
    const grid = createGrid(3, 2); // width=3 (x), height=2 (y)

    expect(grid.length).toBe(2);      // rows (y)
    expect(grid[0].length).toBe(3);   // columns (x)
  });

  it('initializes every cell to defaults', () => {
    const grid = createGrid(2, 2);

    expect(getCell(grid, 0, 0)).toEqual({
      type: 'empty',
      occupied: false,
      roomId: null,
    });

    expect(getCell(grid, 0, 1)).toEqual({
      type: 'empty',
      occupied: false,
      roomId: null,
    });

    expect(getCell(grid, 1, 0)).toEqual({
      type: 'empty',
      occupied: false,
      roomId: null,
    });

    expect(getCell(grid, 1, 1)).toEqual({
      type: 'empty',
      occupied: false,
      roomId: null,
    });
  });

  it('getCell(x, y) returns the correct cell', () => {
    const grid = createGrid(2, 2);

    // Set a cell at (x=1, y=0)
    const updated = setCell(grid, 1, 0, {
      type: 'floor',
      occupied: true,
      roomId: 'room-1',
    });

    expect(getCell(updated, 1, 0)).toEqual({
      type: 'floor',
      occupied: true,
      roomId: 'room-1',
    });
  });

  it('setCell(x, y) only updates the targeted cell', () => {
    const grid = createGrid(2, 2);

    const next = setCell(grid, 0, 1, {
      type: 'wall',
      occupied: false,
      roomId: null,
    });

    // changed cell
    expect(getCell(next, 0, 1)).toEqual({
      type: 'wall',
      occupied: false,
      roomId: null,
    });

    // unchanged cells
    expect(getCell(next, 0, 0)).toEqual({
      type: 'empty',
      occupied: false,
      roomId: null,
    });

    expect(getCell(next, 1, 1)).toEqual({
      type: 'empty',
      occupied: false,
      roomId: null,
    });
  });

  it('throws when x or y is out of bounds', () => {
    const grid = createGrid(2, 2);

    expect(() => getCell(grid, -1, 0)).toThrow();
    expect(() => getCell(grid, 0, -1)).toThrow();
    expect(() => getCell(grid, 2, 0)).toThrow();
    expect(() => getCell(grid, 0, 2)).toThrow();
  });
});
