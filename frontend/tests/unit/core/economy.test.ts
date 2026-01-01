import { totalUpkeepPerTick, upkeepPerTick, staffWagesPerTick } from '../../../src/core/economy';
import { STAFF_WAGE_PER_TICK } from '../../../src/core/constants';
import { createAttractionGrid } from '../../../src/core/grid';
import { newGame } from '../../../src/core/newGame';

describe('economy upkeepPerTick', () => {
  it('is 0 for an empty grid', () => {
    const s = newGame();
    expect(upkeepPerTick(s.midwayGrid)).toBe(0);
  });

  it('charges per room tile deterministically', () => {
    const s = newGame();

    // Mark 1 hallway tile and 2 scare tiles (adjust to your grid helpers if you have them)
    s.midwayGrid[0][0] = {
      ...s.midwayGrid[0][0],
      occupied: true,
      roomType: 'hallway',
      roomId: 'h-1',
    };
    s.midwayGrid[0][1] = {
      ...s.midwayGrid[0][1],
      occupied: true,
      roomType: 'scare',
      roomId: 's-1',
    };
    s.midwayGrid[0][2] = {
      ...s.midwayGrid[0][2],
      occupied: true,
      roomType: 'scare',
      roomId: 's-2',
    };

    expect(upkeepPerTick(s.midwayGrid)).toBe(1 * 1 + 2 * 2);
  });
});

describe('totalUpkeepPerTick', () => {
  it('returns 0 for empty state', () => {
    const s = newGame();
    expect(totalUpkeepPerTick(s)).toBe(0);
  });

  it('includes upkeep from attraction grids', () => {
    const s = newGame();

    // Create attraction with hallway and scare rooms
    const grid = createAttractionGrid(3, 3);
    grid[0][0] = { ...grid[0][0], type: 'floor', occupied: true, roomType: 'entry', roomId: 'e-1' };
    grid[1][1] = {
      ...grid[1][1],
      type: 'floor',
      occupied: true,
      roomType: 'hallway',
      roomId: 'h-1',
    };
    grid[2][2] = { ...grid[2][2], type: 'floor', occupied: true, roomType: 'scare', roomId: 's-1' };

    s.attractions['haunt1'] = {
      id: 'haunt1',
      name: 'Test Haunt',
      grid,
      entryPoint: { x: 0, y: 0 },
      exitPoint: { x: 2, y: 2 },
    };

    // hallway: 1, scare: 2
    expect(totalUpkeepPerTick(s)).toBe(3);
  });

  it('sums upkeep from multiple attractions', () => {
    const s = newGame();

    // First attraction: 1 hallway
    const grid1 = createAttractionGrid(2, 2);
    grid1[0][0] = {
      ...grid1[0][0],
      type: 'floor',
      occupied: true,
      roomType: 'hallway',
      roomId: 'h-1',
    };
    s.attractions['haunt1'] = {
      id: 'haunt1',
      name: 'Haunt 1',
      grid: grid1,
      entryPoint: { x: 0, y: 0 },
      exitPoint: { x: 1, y: 1 },
    };

    // Second attraction: 2 scare rooms
    const grid2 = createAttractionGrid(2, 2);
    grid2[0][0] = {
      ...grid2[0][0],
      type: 'floor',
      occupied: true,
      roomType: 'scare',
      roomId: 's-1',
    };
    grid2[0][1] = {
      ...grid2[0][1],
      type: 'floor',
      occupied: true,
      roomType: 'scare',
      roomId: 's-2',
    };
    s.attractions['haunt2'] = {
      id: 'haunt2',
      name: 'Haunt 2',
      grid: grid2,
      entryPoint: { x: 0, y: 0 },
      exitPoint: { x: 1, y: 1 },
    };

    // 1 hallway (1) + 2 scare (2*2) = 5
    expect(totalUpkeepPerTick(s)).toBe(5);
  });

  it('combines midway and attraction upkeep', () => {
    const s = newGame();

    // Midway: attractionPortal (0 upkeep, but test it's counted)
    s.midwayGrid[0][0] = {
      ...s.midwayGrid[0][0],
      occupied: true,
      roomType: 'attractionPortal',
      roomId: 'p-1',
    };

    // Attraction: 1 scare
    const grid = createAttractionGrid(2, 2);
    grid[0][0] = { ...grid[0][0], type: 'floor', occupied: true, roomType: 'scare', roomId: 's-1' };
    s.attractions['haunt1'] = {
      id: 'haunt1',
      name: 'Haunt',
      grid,
      entryPoint: { x: 0, y: 0 },
      exitPoint: { x: 1, y: 1 },
    };

    // portal: 0, scare: 2
    expect(totalUpkeepPerTick(s)).toBe(2);
  });

  it('includes staff wages in total upkeep', () => {
    const s = newGame();
    s.staffHired = 3;

    expect(totalUpkeepPerTick(s)).toBe(3 * STAFF_WAGE_PER_TICK);
  });

  it('combines room upkeep and staff wages', () => {
    const s = newGame();

    s.midwayGrid[0][0] = {
      ...s.midwayGrid[0][0],
      occupied: true,
      roomType: 'scare',
      roomId: 's-1',
    };

    s.staffHired = 2;

    // scare: 2 + staff wages: 2 * 1 = 4
    expect(totalUpkeepPerTick(s)).toBe(2 + 2 * STAFF_WAGE_PER_TICK);
  });
});

describe('staffWagesPerTick', () => {
  it('returns 0 when no staff hired', () => {
    const s = newGame();
    expect(staffWagesPerTick(s)).toBe(0);
  });

  it('charges STAFF_WAGE_PER_TICK per hired staff', () => {
    const s = newGame();
    s.staffHired = 5;
    expect(staffWagesPerTick(s)).toBe(5 * STAFF_WAGE_PER_TICK);
  });

  it('charges for all hired staff regardless of assignment', () => {
    const s = newGame();
    s.staffHired = 4;
    s.staffAssignments = { 'haunt-1': 2 };

    expect(staffWagesPerTick(s)).toBe(4 * STAFF_WAGE_PER_TICK);
  });
});
