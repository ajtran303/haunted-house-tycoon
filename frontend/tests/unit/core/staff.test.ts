import { newGame } from '../../../src/core/newGame';
import { STAFF_HIRE_COST, STAFF_WAGE_PER_TICK, MAX_STAFF } from '../../../src/core/constants';

describe('Staff as Abstract Resource', () => {
  describe('initial state', () => {
    it('starts with zero staff hired', () => {
      const state = newGame();
      expect(state.staffHired).toBe(0);
    });

    it('starts with empty staff assignments', () => {
      const state = newGame();
      expect(state.staffAssignments).toEqual({});
    });
  });

  describe('constants', () => {
    it('defines staff hire cost', () => {
      expect(STAFF_HIRE_COST).toBe(50);
    });

    it('defines staff wage per tick', () => {
      expect(STAFF_WAGE_PER_TICK).toBe(1);
    });

    it('defines max staff limit', () => {
      expect(MAX_STAFF).toBe(10);
    });
  });

  describe('staff assignments type', () => {
    it('tracks staff count per attraction', () => {
      const state = newGame();
      // staffAssignments is Record<attractionId, staffCount>
      state.staffAssignments['haunt-1'] = 2;
      state.staffAssignments['haunt-2'] = 1;

      expect(state.staffAssignments['haunt-1']).toBe(2);
      expect(state.staffAssignments['haunt-2']).toBe(1);
    });
  });
});
