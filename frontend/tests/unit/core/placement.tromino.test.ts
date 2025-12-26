import { ROOM_COST } from '../../../src/core/constants';
import { getRoomCells, getRoomSize, placeRoom } from '../../../src/core/placement';
import type { Grid, RoomType } from '../../../src/core/types';

const makeGrid = (w: number, h: number): Grid =>
  Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ({
      type: 'floor',
      occupied: false,
      roomId: null,
      roomType: null,
    })),
  );

describe('getRoomCells', () => {
  it('returns single cell for single-cell rooms', () => {
    expect(getRoomCells('hallway')).toEqual([{ x: 0, y: 0 }]);
    expect(getRoomCells('scare')).toEqual([{ x: 0, y: 0 }]);
    expect(getRoomCells('entry')).toEqual([{ x: 0, y: 0 }]);
  });

  it('returns 3 cells for I-shape trominoes', () => {
    // giftShop: horizontal I (3x1)
    expect(getRoomCells('giftShop')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);

    // restroom: vertical I (1x3)
    expect(getRoomCells('restroom')).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ]);
  });

  it('returns 3 cells for L-shape trominoes', () => {
    // photoBooth: L-up-right
    expect(getRoomCells('photoBooth')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);

    // arcade: L-down-right
    expect(getRoomCells('arcade')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ]);

    // firstAid: L-down-left
    expect(getRoomCells('firstAid')).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);

    // foodStall: L-up-left
    expect(getRoomCells('foodStall')).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it('returns 4 cells for 2x2 portal', () => {
    expect(getRoomCells('attractionPortal')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });
});

describe('getRoomSize', () => {
  it('returns 1x1 for single-cell rooms', () => {
    expect(getRoomSize('hallway')).toEqual({ width: 1, height: 1 });
    expect(getRoomSize('scare')).toEqual({ width: 1, height: 1 });
  });

  it('returns correct bounding box for I-shapes', () => {
    expect(getRoomSize('giftShop')).toEqual({ width: 3, height: 1 });
    expect(getRoomSize('restroom')).toEqual({ width: 1, height: 3 });
  });

  it('returns 2x2 bounding box for L-shapes', () => {
    expect(getRoomSize('photoBooth')).toEqual({ width: 2, height: 2 });
    expect(getRoomSize('arcade')).toEqual({ width: 2, height: 2 });
    expect(getRoomSize('firstAid')).toEqual({ width: 2, height: 2 });
    expect(getRoomSize('foodStall')).toEqual({ width: 2, height: 2 });
  });

  it('returns 2x2 for portal', () => {
    expect(getRoomSize('attractionPortal')).toEqual({ width: 2, height: 2 });
  });
});

describe('placeRoom with trominoes', () => {
  const trominoAmenities: RoomType[] = [
    'giftShop',
    'restroom',
    'photoBooth',
    'arcade',
    'firstAid',
    'foodStall',
  ];

  it.each(trominoAmenities)('places %s occupying 3 cells', (roomType) => {
    const grid = makeGrid(5, 5);
    const result = placeRoom({
      grid,
      x: 1,
      y: 1,
      roomType,
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 1,
    });

    expect(result.result.ok).toBe(true);

    // Count occupied cells with this room type
    const cells = getRoomCells(roomType);
    let occupiedCount = 0;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (result.grid[y][x].roomType === roomType) {
          occupiedCount++;
        }
      }
    }
    expect(occupiedCount).toBe(cells.length);
  });

  it('places giftShop (3x1 horizontal) correctly', () => {
    const grid = makeGrid(5, 5);
    const result = placeRoom({
      grid,
      x: 1,
      y: 2,
      roomType: 'giftShop',
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 1,
    });

    expect(result.result.ok).toBe(true);
    expect(result.grid[2][1].roomType).toBe('giftShop');
    expect(result.grid[2][2].roomType).toBe('giftShop');
    expect(result.grid[2][3].roomType).toBe('giftShop');
    // Adjacent cells should not be affected
    expect(result.grid[2][0].roomType).toBeNull();
    expect(result.grid[2][4].roomType).toBeNull();
  });

  it('places restroom (1x3 vertical) correctly', () => {
    const grid = makeGrid(5, 5);
    const result = placeRoom({
      grid,
      x: 2,
      y: 1,
      roomType: 'restroom',
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 1,
    });

    expect(result.result.ok).toBe(true);
    expect(result.grid[1][2].roomType).toBe('restroom');
    expect(result.grid[2][2].roomType).toBe('restroom');
    expect(result.grid[3][2].roomType).toBe('restroom');
  });

  it('places foodStall L-shape correctly', () => {
    const grid = makeGrid(5, 5);
    const result = placeRoom({
      grid,
      x: 1,
      y: 1,
      roomType: 'foodStall',
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 1,
    });

    expect(result.result.ok).toBe(true);
    // L-up-left: (1,0), (0,1), (1,1) offset from origin
    expect(result.grid[1][2].roomType).toBe('foodStall'); // x:1+1, y:1+0
    expect(result.grid[2][1].roomType).toBe('foodStall'); // x:1+0, y:1+1
    expect(result.grid[2][2].roomType).toBe('foodStall'); // x:1+1, y:1+1
    // The "hole" cell should not be occupied
    expect(result.grid[1][1].roomType).toBeNull();
  });

  it('fails with out_of_bounds when tromino extends past grid edge', () => {
    const grid = makeGrid(5, 5);
    // giftShop is 3x1, placing at x:3 means cells at x:3,4,5 - x:5 is out of bounds
    const result = placeRoom({
      grid,
      x: 3,
      y: 2,
      roomType: 'giftShop',
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 1,
    });

    expect(result.result).toEqual({ ok: false, reason: 'out_of_bounds' });
  });

  it('fails with not_enough_space when any tromino cell is occupied', () => {
    const grid = makeGrid(5, 5);
    // Place a hallway at (2,1)
    const gridWithRoom = placeRoom({
      grid,
      x: 2,
      y: 1,
      roomType: 'hallway',
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 1,
    }).grid;

    // Try to place giftShop at (1,1) - would occupy (1,1), (2,1), (3,1)
    // (2,1) is already occupied
    const result = placeRoom({
      grid: gridWithRoom,
      x: 1,
      y: 1,
      roomType: 'giftShop',
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 2,
    });

    expect(result.result).toEqual({ ok: false, reason: 'not_enough_space' });
  });

  it('deducts correct cost for tromino amenities', () => {
    const grid = makeGrid(5, 5);
    const result = placeRoom({
      grid,
      x: 1,
      y: 1,
      roomType: 'arcade',
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 1,
    });

    expect(result.result.ok).toBe(true);
    expect(result.money).toBe(1000 - ROOM_COST.arcade);
  });

  it('assigns same roomId to all cells of a tromino', () => {
    const grid = makeGrid(5, 5);
    const result = placeRoom({
      grid,
      x: 1,
      y: 1,
      roomType: 'photoBooth',
      money: 1000,
      costByType: ROOM_COST,
      nextRoomId: 42,
    });

    expect(result.result.ok).toBe(true);
    if (result.result.ok) {
      expect(result.result.roomId).toBe('photoBooth-42');
    }

    // All cells should have the same roomId
    const cells = getRoomCells('photoBooth');
    for (const c of cells) {
      expect(result.grid[1 + c.y][1 + c.x].roomId).toBe('photoBooth-42');
    }
  });
});
