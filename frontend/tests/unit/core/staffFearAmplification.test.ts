import { BASE_STAFF_FEAR_BONUS } from '../../../src/core/constants';
import { calculateStaffFearBonus } from '../../../src/core/staff';
import { applyRoomEmotionEffects } from '../../../src/core/visitors/applyRoomEmotionEffects';
import { createAttractionGrid } from '../../../src/core/grid';
import { makeVisitor } from '../../helpers/factories';
import type { AttractionGrid, Grid } from '../../../src/core/types';

describe('Staff Fear Amplification', () => {
  describe('calculateStaffFearBonus', () => {
    it('returns 0 when no staff assigned', () => {
      expect(calculateStaffFearBonus(0)).toBe(0);
    });

    it('returns BASE_STAFF_FEAR_BONUS for 1 staff', () => {
      // floor(10 * sqrt(1)) = floor(10 * 1) = 10
      expect(calculateStaffFearBonus(1)).toBe(BASE_STAFF_FEAR_BONUS);
    });

    it('returns floor(BASE * sqrt(2)) for 2 staff', () => {
      // floor(10 * sqrt(2)) = floor(10 * 1.414) = 14
      expect(calculateStaffFearBonus(2)).toBe(14);
    });

    it('returns floor(BASE * sqrt(4)) for 4 staff', () => {
      // floor(10 * sqrt(4)) = floor(10 * 2) = 20
      expect(calculateStaffFearBonus(4)).toBe(20);
    });

    it('shows diminishing returns', () => {
      const bonus1 = calculateStaffFearBonus(1);
      const bonus2 = calculateStaffFearBonus(2);
      const bonus4 = calculateStaffFearBonus(4);

      // Each doubling of staff gives less than double the bonus
      expect(bonus2).toBeLessThan(bonus1 * 2);
      expect(bonus4).toBeLessThan(bonus2 * 2);
    });
  });

  describe('applyRoomEmotionEffects with staff', () => {
    const makeAttractionWithScareRoom = (): AttractionGrid => {
      const grid = createAttractionGrid(3, 3);
      grid[1][1] = { ...grid[1][1], type: 'floor', occupied: true, roomType: 'scare', roomId: 's-1' };
      return {
        id: 'haunt-1',
        name: 'Test Haunt',
        grid,
        entryPoint: { x: 0, y: 0 },
        exitPoint: { x: 2, y: 2 },
      };
    };

    it('applies base fear without staff', () => {
      const attraction = makeAttractionWithScareRoom();
      const visitor = makeVisitor({
        position: { x: 1, y: 1 },
        prevPos: { x: 0, y: 1 }, // moved into scare room
        location: { type: 'attraction', attractionId: 'haunt-1' },
        fear: 0,
      });

      const [result] = applyRoomEmotionEffects(
        [visitor],
        { midwayGrid: createAttractionGrid(3, 3) as Grid, attractions: { 'haunt-1': attraction } },
        {}, // no staff assignments
      );

      expect(result.fear).toBe(8); // base scare fear
    });

    it('applies amplified fear with staff assigned', () => {
      const attraction = makeAttractionWithScareRoom();
      const visitor = makeVisitor({
        position: { x: 1, y: 1 },
        prevPos: { x: 0, y: 1 }, // moved into scare room
        location: { type: 'attraction', attractionId: 'haunt-1' },
        fear: 0,
      });

      const [result] = applyRoomEmotionEffects(
        [visitor],
        { midwayGrid: createAttractionGrid(3, 3) as Grid, attractions: { 'haunt-1': attraction } },
        { 'haunt-1': 2 }, // 2 staff assigned
      );

      // base (8) + staff bonus (14) = 22
      expect(result.fear).toBe(8 + 14);
    });

    it('does not apply staff bonus on midway', () => {
      const midwayGrid = createAttractionGrid(3, 3) as Grid;
      midwayGrid[1][1] = { ...midwayGrid[1][1], type: 'floor', occupied: true, roomType: 'scare', roomId: 's-1' };

      const visitor = makeVisitor({
        position: { x: 1, y: 1 },
        prevPos: { x: 0, y: 1 },
        location: { type: 'midway' },
        fear: 0,
      });

      const [result] = applyRoomEmotionEffects(
        [visitor],
        { midwayGrid, attractions: {} },
        { 'some-haunt': 4 }, // staff assigned elsewhere
      );

      expect(result.fear).toBe(8); // only base fear, no staff bonus
    });

    it('does not apply staff bonus to non-scare rooms', () => {
      const attraction = makeAttractionWithScareRoom();
      // Put visitor in hallway instead
      attraction.grid[0][1] = { ...attraction.grid[0][1], type: 'floor', occupied: true, roomType: 'hallway', roomId: 'h-1' };

      const visitor = makeVisitor({
        position: { x: 1, y: 0 },
        prevPos: { x: 0, y: 0 },
        location: { type: 'attraction', attractionId: 'haunt-1' },
        fear: 0,
      });

      const [result] = applyRoomEmotionEffects(
        [visitor],
        { midwayGrid: createAttractionGrid(3, 3) as Grid, attractions: { 'haunt-1': attraction } },
        { 'haunt-1': 4 },
      );

      expect(result.fear).toBe(0); // hallway has no fear effect
    });

    it('does not apply staff bonus when not entering (standing still)', () => {
      const attraction = makeAttractionWithScareRoom();
      const visitor = makeVisitor({
        position: { x: 1, y: 1 },
        prevPos: { x: 1, y: 1 }, // same position - didn't move
        location: { type: 'attraction', attractionId: 'haunt-1' },
        fear: 10,
      });

      const [result] = applyRoomEmotionEffects(
        [visitor],
        { midwayGrid: createAttractionGrid(3, 3) as Grid, attractions: { 'haunt-1': attraction } },
        { 'haunt-1': 4 },
      );

      // Standing still in scare room applies per-tick misery (-1 happiness) but no fear
      expect(result.fear).toBe(10); // unchanged
    });
  });
});
