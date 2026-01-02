import { MAX_STAFF, STAFF_HIRE_COST } from '../../../src/core/constants';
import { useGameStore } from '../../../src/runtime/store';

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
      grid[0][0] = {
        ...grid[0][0],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: 's-1',
      };
      grid[0][1] = {
        ...grid[0][1],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: 's-2',
      };
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

  describe('staff lifecycle', () => {
    it('resets staff on newGame', () => {
      useGameStore.setState({
        staffHired: 5,
        staffAssignments: { 'haunt-1': 3, 'haunt-2': 2 },
      });

      useGameStore.getState().newGame();

      expect(useGameStore.getState().staffHired).toBe(0);
      expect(useGameStore.getState().staffAssignments).toEqual({});
    });

    it('ignores staff actions when failed', () => {
      useGameStore.setState({
        lifecycle: 'failed',
        staffHired: 0,
        money: 1000,
      });

      useGameStore.getState().hireStaff();

      expect(useGameStore.getState().staffHired).toBe(0);
    });

    it('staff state persists on fail but is ignored', () => {
      useGameStore.setState({
        staffHired: 5,
        staffAssignments: { 'haunt-1': 3 },
      });

      useGameStore.getState().fail();

      // State persists but lifecycle prevents actions
      expect(useGameStore.getState().lifecycle).toBe('failed');
      // After newGame, staff is reset
      useGameStore.getState().newGame();
      expect(useGameStore.getState().staffHired).toBe(0);
      expect(useGameStore.getState().staffAssignments).toEqual({});
    });
  });
});
