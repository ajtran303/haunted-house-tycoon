import { createAttraction, getVisitorGrid } from '../../../src/core/attractions';
import type { Visitor } from '../../../src/core/types';
import { createAttractionGrid, createGrid, makeState, makeVisitor } from '../../helpers/factories';

describe('createAttraction', () => {
  it('creates an attraction with correct id and name', () => {
    const attraction = createAttraction(
      'haunt1',
      'Spooky Manor',
      8,
      8,
      { x: 0, y: 0 },
      { x: 7, y: 7 },
    );

    expect(attraction.id).toBe('haunt1');
    expect(attraction.name).toBe('Spooky Manor');
  });

  it('creates a grid with specified dimensions', () => {
    const attraction = createAttraction('haunt1', 'Test', 10, 6, { x: 0, y: 0 }, { x: 9, y: 5 });

    expect(attraction.grid.length).toBe(6); // height
    expect(attraction.grid[0].length).toBe(10); // width
  });

  it('sets entry and exit points correctly', () => {
    const entryPoint = { x: 1, y: 2 };
    const exitPoint = { x: 5, y: 4 };
    const attraction = createAttraction('haunt1', 'Test', 8, 8, entryPoint, exitPoint);

    expect(attraction.entryPoint).toEqual(entryPoint);
    expect(attraction.exitPoint).toEqual(exitPoint);
  });

  it('creates an empty grid (all cells empty)', () => {
    const attraction = createAttraction('haunt1', 'Test', 4, 4, { x: 0, y: 0 }, { x: 3, y: 3 });

    for (const row of attraction.grid) {
      for (const cell of row) {
        expect(cell.type).toBe('empty');
        expect(cell.roomType).toBeNull();
        expect(cell.occupied).toBe(false);
      }
    }
  });
});

describe('getVisitorGrid', () => {
  const createTestVisitor = (location: Visitor['location']) => makeVisitor({ location });

  const createTestState = () =>
    makeState({
      midwayGrid: createGrid(10, 10),
      attractions: {
        haunt1: {
          id: 'haunt1',
          name: 'Spooky Manor',
          grid: createAttractionGrid(8, 8),
          entryPoint: { x: 0, y: 0 },
          exitPoint: { x: 7, y: 7 },
        },
      },
      entrance: null,
      exit: null,
    });

  it('returns midway grid for visitor on midway', () => {
    const state = createTestState();
    const visitor = createTestVisitor({ type: 'midway' });

    const grid = getVisitorGrid(state, visitor);

    expect(grid).toBe(state.midwayGrid);
    expect(grid.length).toBe(10); // midway is 10x10
  });

  it('returns attraction grid for visitor in attraction', () => {
    const state = createTestState();
    const visitor = createTestVisitor({ type: 'attraction', attractionId: 'haunt1' });

    const grid = getVisitorGrid(state, visitor);

    expect(grid).toBe(state.attractions['haunt1'].grid);
    expect(grid.length).toBe(8); // attraction is 8x8
  });
});
