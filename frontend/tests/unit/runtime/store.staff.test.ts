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

  describe('assignStaff', () => {
    it('assigns staff to attraction', () => {
      // Create attraction with scare rooms
      useGameStore.getState().createAttraction('haunt-1', 'Test Haunt', 4, 4);
      const grid = useGameStore.getState().attractions['haunt-1'].grid;
      grid[0][0] = { ...grid[0][0], type: 'floor', occupied: true, roomType: 'scare', roomId: 's-1' };
      grid[0][1] = { ...grid[0][1], type: 'floor', occupied: true, roomType: 'scare', roomId: 's-2' };
      useGameStore.setState({
        attractions: {
          'haunt-1': { ...useGameStore.getState().attractions['haunt-1'], grid },
        },
        staffHired: 3,
      });

      useGameStore.getState().assignStaff('haunt-1');

      expect(useGameStore.getState().staffAssignments['haunt-1']).toBe(1);
    });

    it('does nothing when paused', () => {
      useGameStore.getState().createAttraction('haunt-1', 'Test Haunt', 4, 4);
      useGameStore.setState({ staffHired: 3 });
      useGameStore.getState().pause();

      useGameStore.getState().assignStaff('haunt-1');

      expect(useGameStore.getState().staffAssignments['haunt-1']).toBeUndefined();
    });
  });

  describe('unassignStaff', () => {
    it('unassigns staff from attraction', () => {
      useGameStore.getState().createAttraction('haunt-1', 'Test Haunt', 4, 4);
      useGameStore.setState({
        staffHired: 3,
        staffAssignments: { 'haunt-1': 2 },
      });

      useGameStore.getState().unassignStaff('haunt-1');

      expect(useGameStore.getState().staffAssignments['haunt-1']).toBe(1);
    });

    it('does nothing when paused', () => {
      useGameStore.getState().createAttraction('haunt-1', 'Test Haunt', 4, 4);
      useGameStore.setState({
        staffHired: 3,
        staffAssignments: { 'haunt-1': 2 },
      });
      useGameStore.getState().pause();

      useGameStore.getState().unassignStaff('haunt-1');

      expect(useGameStore.getState().staffAssignments['haunt-1']).toBe(2);
    });
  });
});
