import { newGame } from '../../../src/core/newGame';
import { STAFF_HIRE_COST, STAFF_WAGE_PER_TICK, MAX_STAFF } from '../../../src/core/constants';
import { hireStaff, fireStaff } from '../../../src/core/staff';
import { makeState } from '../../helpers/factories';

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

describe('Hire/Fire Staff', () => {
  describe('hireStaff', () => {
    it('increments staffHired by 1', () => {
      const state = makeState({ staffHired: 0, money: 100 });
      const result = hireStaff(state);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffHired).toBe(1);
      }
    });

    it('deducts STAFF_HIRE_COST from money', () => {
      const state = makeState({ staffHired: 0, money: 100 });
      const result = hireStaff(state);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.money).toBe(100 - STAFF_HIRE_COST);
      }
    });

    it('fails if insufficient funds', () => {
      const state = makeState({ staffHired: 0, money: STAFF_HIRE_COST - 1 });
      const result = hireStaff(state);

      expect(result).toEqual({ ok: false, reason: 'insufficient_funds' });
    });

    it('fails if already at MAX_STAFF', () => {
      const state = makeState({ staffHired: MAX_STAFF, money: 1000 });
      const result = hireStaff(state);

      expect(result).toEqual({ ok: false, reason: 'max_staff_reached' });
    });

    it('succeeds when exactly at STAFF_HIRE_COST', () => {
      const state = makeState({ staffHired: 0, money: STAFF_HIRE_COST });
      const result = hireStaff(state);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.money).toBe(0);
        expect(result.staffHired).toBe(1);
      }
    });
  });

  describe('fireStaff', () => {
    it('decrements staffHired by 1', () => {
      const state = makeState({ staffHired: 3, money: 100 });
      const result = fireStaff(state);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffHired).toBe(2);
      }
    });

    it('does not refund any money', () => {
      const state = makeState({ staffHired: 3, money: 100 });
      const result = fireStaff(state);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.money).toBe(100);
      }
    });

    it('fails if no staff to fire', () => {
      const state = makeState({ staffHired: 0, money: 100 });
      const result = fireStaff(state);

      expect(result).toEqual({ ok: false, reason: 'no_staff_to_fire' });
    });

    it('unassigns staff from attractions if needed', () => {
      // 3 staff hired, 2 assigned to haunt-1
      // After firing, should have 2 hired, 2 still assigned (no change needed)
      const state = makeState({
        staffHired: 3,
        money: 100,
        staffAssignments: { 'haunt-1': 2 },
      });
      const result = fireStaff(state);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffHired).toBe(2);
        expect(result.staffAssignments['haunt-1']).toBe(2);
      }
    });

    it('reduces assignments when firing would leave fewer staff than assigned', () => {
      // 2 staff hired, 2 assigned to haunt-1
      // After firing, should have 1 hired, 1 assigned
      const state = makeState({
        staffHired: 2,
        money: 100,
        staffAssignments: { 'haunt-1': 2 },
      });
      const result = fireStaff(state);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffHired).toBe(1);
        expect(result.staffAssignments['haunt-1']).toBe(1);
      }
    });

    it('distributes unassignment across multiple attractions', () => {
      // 2 staff hired, 1 assigned to each of 2 attractions
      // After firing, should have 1 hired, need to unassign 1 from somewhere
      const state = makeState({
        staffHired: 2,
        money: 100,
        staffAssignments: { 'haunt-1': 1, 'haunt-2': 1 },
      });
      const result = fireStaff(state);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffHired).toBe(1);
        const totalAssigned =
          (result.staffAssignments['haunt-1'] ?? 0) +
          (result.staffAssignments['haunt-2'] ?? 0);
        expect(totalAssigned).toBe(1);
      }
    });
  });
});
