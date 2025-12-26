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
    // Use giftShop (3x1 horizontal) for simpler positioning
    // Placed at (1,2), cells at (1,2), (2,2), (3,2)
    const gridWithShop = placeRoom(grid, 1, 2, 'giftShop');

    // Visitor on giftShop but didn't move (prevPos same as position)
    const v = makeVisitor({
      position: { x: 2, y: 2 },
      prevPos: { x: 2, y: 2 },
    });

    expect(calculateAmenityPurchases([v], gridWithShop)).toBe(0);
  });

  it('returns purchase amount when visitor enters amenity', () => {
    const grid = createGrid(5, 5);
    // foodStall is L-up-left: cells at offsets (1,0), (0,1), (1,1)
    // Placed at (1,1), so actual cells are (2,1), (1,2), (2,2)
    const gridWithFood = placeRoom(grid, 1, 1, 'foodStall');

    // Visitor just moved onto foodStall cell at (2,2)
    const v = makeVisitor({
      position: { x: 2, y: 2 },
      prevPos: { x: 2, y: 3 },
      fear: 0,
      happiness: 50,
    });

    const expected = amenityPurchaseAmount(v);
    expect(calculateAmenityPurchases([v], gridWithFood)).toBe(expected);
  });

  it('sums purchases for multiple visitors entering amenities', () => {
    const grid = createGrid(8, 8);
    // Use giftShop (3x1 horizontal) for easier positioning
    // giftShop at (1,2) occupies cells (1,2), (2,2), (3,2)
    // giftShop at (1,5) occupies cells (1,5), (2,5), (3,5)
    let gridWithAmenities = placeRoom(grid, 1, 2, 'giftShop');
    gridWithAmenities = placeRoom(gridWithAmenities, 1, 5, 'giftShop');

    const v1 = makeVisitor({
      id: 1,
      position: { x: 2, y: 2 },
      prevPos: { x: 2, y: 1 },
      fear: 0,
      happiness: 50,
    });

    const v2 = makeVisitor({
      id: 2,
      position: { x: 2, y: 5 },
      prevPos: { x: 2, y: 4 },
      fear: 0,
      happiness: 50,
    });

    const expected = amenityPurchaseAmount(v1) + amenityPurchaseAmount(v2);
    expect(calculateAmenityPurchases([v1, v2], gridWithAmenities)).toBe(expected);
  });

  it('ignores visitors in attractions (amenities are midway-only)', () => {
    const grid = createGrid(5, 5);
    // giftShop at (1,2) occupies cells (1,2), (2,2), (3,2)
    const gridWithShop = placeRoom(grid, 1, 2, 'giftShop');

    const v = makeVisitor({
      position: { x: 2, y: 2 },
      prevPos: { x: 2, y: 1 },
      location: { type: 'attraction', attractionId: 'haunt1' },
    });

    expect(calculateAmenityPurchases([v], gridWithShop)).toBe(0);
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
    // giftShop at (0,0) occupies cells (0,0), (1,0), (2,0)
    const gridWithShop = placeRoom(grid, 0, 0, 'giftShop');

    // Visitor just spawned on giftShop (prevPos is null)
    const v = makeVisitor({
      position: { x: 1, y: 0 },
      prevPos: null,
    });

    expect(calculateAmenityPurchases([v], gridWithShop)).toBe(0);
  });

  describe('all tromino amenity types trigger purchases', () => {
    const amenityTypes = [
      { type: 'foodStall', entryCell: { x: 1, y: 1 } }, // L-up-left, enter at (1,1)
      { type: 'giftShop', entryCell: { x: 1, y: 0 } }, // I-horizontal
      { type: 'restroom', entryCell: { x: 0, y: 1 } }, // I-vertical
      { type: 'photoBooth', entryCell: { x: 0, y: 0 } }, // L-up-right
      { type: 'arcade', entryCell: { x: 1, y: 0 } }, // L-down-right
      { type: 'firstAid', entryCell: { x: 0, y: 1 } }, // L-down-left
    ] as const;

    it.each(amenityTypes)(
      'triggers purchase when visitor enters $type',
      ({ type, entryCell }) => {
        const grid = createGrid(8, 8);
        const gridWithAmenity = placeRoom(grid, 2, 2, type);

        // Visitor entering any cell of the amenity
        const v = makeVisitor({
          position: { x: 2 + entryCell.x, y: 2 + entryCell.y },
          prevPos: { x: 1, y: 2 + entryCell.y },
          fear: 0,
          happiness: 50,
        });

        const purchase = calculateAmenityPurchases([v], gridWithAmenity);
        expect(purchase).toBeGreaterThan(0);
      },
    );
  });
});
