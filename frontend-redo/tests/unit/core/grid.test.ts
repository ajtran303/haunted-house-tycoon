import { createGrid } from '../../../src/core/grid';

describe('createGrid', () => {
  it('creates a grid with dimensions', () => {
    const grid = createGrid(3, 2);

    expect(grid).toHaveLength(2); // height (2 rows)
    expect(grid[0]).toHaveLength(3); // width (col 1 has 3 cells)
    expect(grid[1]).toHaveLength(3); // width (col 2 has 3 cells)
  });

  it('initializes cells to default state', () => {
    const grid = createGrid(2, 2);

    for (const row of grid) {
      for (const cell of row) {
        expect(cell).toEqual({
          type: 'floor',
          occupied: false,
          roomId: null,
        });
      }
    }
  });

  it('each row is unique', () => {
    const grid = createGrid(2, 2);

    expect(grid[0]).not.toBe(grid[1]);
  });

  it('each cell is unique', () => {
    const grid = createGrid(2, 2);

    expect(grid[0][0]).not.toBe(grid[0][1]);
    expect(grid[0][0]).not.toBe(grid[1][0]);
    expect(grid[0][1]).not.toBe(grid[1][1]);
  });

  it('throws on invalid dimensions', () => {
    expect(() => createGrid(0, 1)).toThrow();
    expect(() => createGrid(1, 0)).toThrow();
    expect(() => createGrid(-1, 1)).toThrow();
    expect(() => createGrid(1, -1)).toThrow();
    expect(() => createGrid(1.5, 2)).toThrow();
    expect(() => createGrid(2, 2.2)).toThrow();
  });
});
