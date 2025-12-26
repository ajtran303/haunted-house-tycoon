import { AMENITY_BASE_PURCHASE } from '../../../../src/core/constants';
import {
  amenityPurchaseAmount,
  calculateAmenityPurchases,
} from '../../../../src/core/visitors/amenityPurchases';
import { spendingPerTick } from '../../../../src/core/visitors/spending';
import { createGrid, makeVisitor, placeRoom } from '../../../helpers/factories';

describe('amenityPurchaseAmount', () => {
  it('multiplies base purchase by spending multiplier', () => {
    const v = makeVisitor({ fear: 0, happiness: 50 });
    const multiplier = spendingPerTick(v);
    const expected = AMENITY_BASE_PURCHASE * multiplier;

    expect(amenityPurchaseAmount(v)).toBe(expected);
  });

  it('returns higher amount for visitors with high fear (spending bonus)', () => {
    const lowFear = makeVisitor({ fear: 10, happiness: 50 });
    const highFear = makeVisitor({ fear: 70, happiness: 50 });

    expect(amenityPurchaseAmount(highFear)).toBeGreaterThan(amenityPurchaseAmount(lowFear));
  });

  it('returns higher amount for visitors with high happiness', () => {
    const lowHappy = makeVisitor({ fear: 0, happiness: 30 });
    const highHappy = makeVisitor({ fear: 0, happiness: 90 });

    expect(amenityPurchaseAmount(highHappy)).toBeGreaterThan(amenityPurchaseAmount(lowHappy));
  });

  it('returns 0 for visitors too unhappy to spend', () => {
    const miserable = makeVisitor({ fear: 0, happiness: 5 });

    expect(amenityPurchaseAmount(miserable)).toBe(0);
  });

  it('returns 0 for visitors in panic (fear too high)', () => {
    const panicked = makeVisitor({ fear: 95, happiness: 50 });

    expect(amenityPurchaseAmount(panicked)).toBe(0);
  });
});

describe('calculateAmenityPurchases', () => {
  it('returns 0 when no visitors enter amenities', () => {
    const grid = createGrid(5, 5);
    const gridWithFood = placeRoom(grid, 2, 2, 'foodStall');

    // Visitor not on the foodStall
    const v = makeVisitor({ position: { x: 0, y: 0 }, prevPos: null });

    expect(calculateAmenityPurchases([v], gridWithFood)).toBe(0);
  });

  it('returns 0 when visitor is standing still on amenity (not entering)', () => {
    const grid = createGrid(5, 5);
    const gridWithFood = placeRoom(grid, 2, 2, 'foodStall');

    // Visitor on foodStall but didn't move (prevPos same as position)
    const v = makeVisitor({
      position: { x: 2, y: 2 },
      prevPos: { x: 2, y: 2 },
    });

    expect(calculateAmenityPurchases([v], gridWithFood)).toBe(0);
  });

  it('returns purchase amount when visitor enters amenity', () => {
    const grid = createGrid(5, 5);
    const gridWithFood = placeRoom(grid, 2, 2, 'foodStall');

    // Visitor just moved onto foodStall
    const v = makeVisitor({
      position: { x: 2, y: 2 },
      prevPos: { x: 1, y: 2 },
      fear: 0,
      happiness: 50,
    });

    const expected = amenityPurchaseAmount(v);
    expect(calculateAmenityPurchases([v], gridWithFood)).toBe(expected);
  });

  it('sums purchases for multiple visitors entering amenities', () => {
    const grid = createGrid(5, 5);
    let gridWithFood = placeRoom(grid, 2, 2, 'foodStall');
    gridWithFood = placeRoom(gridWithFood, 3, 3, 'foodStall');

    const v1 = makeVisitor({
      id: 1,
      position: { x: 2, y: 2 },
      prevPos: { x: 1, y: 2 },
      fear: 0,
      happiness: 50,
    });

    const v2 = makeVisitor({
      id: 2,
      position: { x: 3, y: 3 },
      prevPos: { x: 3, y: 2 },
      fear: 0,
      happiness: 50,
    });

    const expected = amenityPurchaseAmount(v1) + amenityPurchaseAmount(v2);
    expect(calculateAmenityPurchases([v1, v2], gridWithFood)).toBe(expected);
  });

  it('ignores visitors in attractions (amenities are midway-only)', () => {
    const grid = createGrid(5, 5);
    const gridWithFood = placeRoom(grid, 2, 2, 'foodStall');

    const v = makeVisitor({
      position: { x: 2, y: 2 },
      prevPos: { x: 1, y: 2 },
      location: { type: 'attraction', attractionId: 'haunt1' },
    });

    expect(calculateAmenityPurchases([v], gridWithFood)).toBe(0);
  });

  it('ignores visitors entering non-amenity rooms', () => {
    const grid = createGrid(5, 5);
    const gridWithHallway = placeRoom(grid, 2, 2, 'hallway');

    const v = makeVisitor({
      position: { x: 2, y: 2 },
      prevPos: { x: 1, y: 2 },
    });

    expect(calculateAmenityPurchases([v], gridWithHallway)).toBe(0);
  });

  it('ignores visitors with null prevPos (just spawned)', () => {
    const grid = createGrid(5, 5);
    const gridWithFood = placeRoom(grid, 0, 0, 'foodStall');

    // Visitor just spawned on foodStall (prevPos is null)
    const v = makeVisitor({
      position: { x: 0, y: 0 },
      prevPos: null,
    });

    expect(calculateAmenityPurchases([v], gridWithFood)).toBe(0);
  });
});
