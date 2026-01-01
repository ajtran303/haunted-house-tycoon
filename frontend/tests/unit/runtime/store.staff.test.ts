import { useGameStore } from '../../../src/runtime/store';
import { STAFF_HIRE_COST, MAX_STAFF } from '../../../src/core/constants';

describe('store staff actions', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
    useGameStore.getState().startRun();
  });

  describe('hireStaff', () => {
    it('increments staffHired and deducts cost', () => {
      const initialMoney = useGameStore.getState().money;

      useGameStore.getState().hireStaff();

      expect(useGameStore.getState().staffHired).toBe(1);
      expect(useGameStore.getState().money).toBe(initialMoney - STAFF_HIRE_COST);
    });

    it('does nothing when paused', () => {
      useGameStore.getState().pause();
      useGameStore.getState().hireStaff();

      expect(useGameStore.getState().staffHired).toBe(0);
    });

    it('does nothing when at max staff', () => {
      // Hire to max
      useGameStore.setState({ staffHired: MAX_STAFF });
      const initialMoney = useGameStore.getState().money;

      useGameStore.getState().hireStaff();

      expect(useGameStore.getState().staffHired).toBe(MAX_STAFF);
      expect(useGameStore.getState().money).toBe(initialMoney);
    });

    it('does nothing when insufficient funds', () => {
      useGameStore.setState({ money: STAFF_HIRE_COST - 1 });

      useGameStore.getState().hireStaff();

      expect(useGameStore.getState().staffHired).toBe(0);
    });
  });

  describe('fireStaff', () => {
    it('decrements staffHired without refund', () => {
      useGameStore.setState({ staffHired: 3 });
      const initialMoney = useGameStore.getState().money;

      useGameStore.getState().fireStaff();

      expect(useGameStore.getState().staffHired).toBe(2);
      expect(useGameStore.getState().money).toBe(initialMoney);
    });

    it('does nothing when paused', () => {
      useGameStore.setState({ staffHired: 3 });
      useGameStore.getState().pause();

      useGameStore.getState().fireStaff();

      expect(useGameStore.getState().staffHired).toBe(3);
    });

    it('does nothing when no staff to fire', () => {
      useGameStore.getState().fireStaff();

      expect(useGameStore.getState().staffHired).toBe(0);
    });

    it('unassigns staff when needed', () => {
      useGameStore.setState({
        staffHired: 2,
        staffAssignments: { 'haunt-1': 2 },
      });

      useGameStore.getState().fireStaff();

      expect(useGameStore.getState().staffHired).toBe(1);
      expect(useGameStore.getState().staffAssignments['haunt-1']).toBe(1);
    });
  });
});
