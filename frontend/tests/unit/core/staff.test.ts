import {
  HAUNT_STAFF_CAP,
  MAX_STAFF,
  STAFF_HIRE_COST,
  STAFF_WAGE_PER_TICK,
} from '../../../src/core/constants';
import { createAttractionGrid } from '../../../src/core/grid';
import { newGame } from '../../../src/core/newGame';
import {
  assignStaffToAttraction,
  fireStaff,
  getAttractionStaffCapacity,
  hireStaff,
  unassignStaffFromAttraction,
} from '../../../src/core/staff';
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
          (result.staffAssignments['haunt-1'] ?? 0) + (result.staffAssignments['haunt-2'] ?? 0);
        expect(totalAssigned).toBe(1);
      }
    });
  });
});

describe('Haunt Staff Capacity', () => {
  describe('constants', () => {
    it('defines HAUNT_STAFF_CAP as 4', () => {
      expect(HAUNT_STAFF_CAP).toBe(4);
    });
  });

  describe('getAttractionStaffCapacity', () => {
    it('returns 0 for attraction with no scare rooms', () => {
      const grid = createAttractionGrid(3, 3);
      // Only entry and exit, no scare rooms
      grid[0][0] = {
        ...grid[0][0],
        type: 'floor',
        occupied: true,
        roomType: 'entry',
        roomId: 'e-1',
      };
      grid[2][2] = {
        ...grid[2][2],
        type: 'floor',
        occupied: true,
        roomType: 'exit',
        roomId: 'x-1',
      };

      const attraction = {
        id: 'haunt-1',
        name: 'Test Haunt',
        grid,
        entryPoint: { x: 0, y: 0 },
        exitPoint: { x: 2, y: 2 },
      };

      expect(getAttractionStaffCapacity(attraction)).toBe(0);
    });

    it('returns scare room count when below cap', () => {
      const grid = createAttractionGrid(3, 3);
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

      const attraction = {
        id: 'haunt-1',
        name: 'Test Haunt',
        grid,
        entryPoint: { x: 0, y: 0 },
        exitPoint: { x: 2, y: 2 },
      };

      expect(getAttractionStaffCapacity(attraction)).toBe(2);
    });

    it('caps at HAUNT_STAFF_CAP regardless of scare room count', () => {
      const grid = createAttractionGrid(4, 4);
      // Add 6 scare rooms (more than cap of 4)
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
      grid[0][2] = {
        ...grid[0][2],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: 's-3',
      };
      grid[1][0] = {
        ...grid[1][0],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: 's-4',
      };
      grid[1][1] = {
        ...grid[1][1],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: 's-5',
      };
      grid[1][2] = {
        ...grid[1][2],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: 's-6',
      };

      const attraction = {
        id: 'haunt-1',
        name: 'Test Haunt',
        grid,
        entryPoint: { x: 0, y: 0 },
        exitPoint: { x: 3, y: 3 },
      };

      expect(getAttractionStaffCapacity(attraction)).toBe(HAUNT_STAFF_CAP);
    });

    it('returns exactly HAUNT_STAFF_CAP when scare rooms equal cap', () => {
      const grid = createAttractionGrid(3, 3);
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
      grid[1][0] = {
        ...grid[1][0],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: 's-3',
      };
      grid[1][1] = {
        ...grid[1][1],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: 's-4',
      };

      const attraction = {
        id: 'haunt-1',
        name: 'Test Haunt',
        grid,
        entryPoint: { x: 0, y: 0 },
        exitPoint: { x: 2, y: 2 },
      };

      expect(getAttractionStaffCapacity(attraction)).toBe(4);
    });
  });
});

describe('Assign Staff to Attractions', () => {
  const makeAttractionWithScareRooms = (scareCount: number) => {
    const grid = createAttractionGrid(4, 4);
    for (let i = 0; i < scareCount; i++) {
      const x = i % 4;
      const y = Math.floor(i / 4);
      grid[y][x] = {
        ...grid[y][x],
        type: 'floor',
        occupied: true,
        roomType: 'scare',
        roomId: `s-${i}`,
      };
    }
    return {
      id: 'haunt-1',
      name: 'Test Haunt',
      grid,
      entryPoint: { x: 0, y: 0 },
      exitPoint: { x: 3, y: 3 },
    };
  };

  describe('assignStaffToAttraction', () => {
    it('assigns one staff to attraction', () => {
      const attraction = makeAttractionWithScareRooms(2);
      const state = makeState({
        staffHired: 3,
        staffAssignments: {},
        attractions: { 'haunt-1': attraction },
      });

      const result = assignStaffToAttraction(state, 'haunt-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffAssignments['haunt-1']).toBe(1);
      }
    });

    it('increments existing assignment', () => {
      const attraction = makeAttractionWithScareRooms(3);
      const state = makeState({
        staffHired: 3,
        staffAssignments: { 'haunt-1': 1 },
        attractions: { 'haunt-1': attraction },
      });

      const result = assignStaffToAttraction(state, 'haunt-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffAssignments['haunt-1']).toBe(2);
      }
    });

    it('fails if attraction does not exist', () => {
      const state = makeState({
        staffHired: 3,
        staffAssignments: {},
        attractions: {},
      });

      const result = assignStaffToAttraction(state, 'nonexistent');

      expect(result).toEqual({ ok: false, reason: 'attraction_not_found' });
    });

    it('fails if no unassigned staff available', () => {
      const attraction = makeAttractionWithScareRooms(2);
      const state = makeState({
        staffHired: 2,
        staffAssignments: { 'haunt-1': 2 }, // all staff already assigned
        attractions: { 'haunt-1': attraction },
      });

      const result = assignStaffToAttraction(state, 'haunt-1');

      expect(result).toEqual({ ok: false, reason: 'no_unassigned_staff' });
    });

    it('fails if attraction at capacity', () => {
      const attraction = makeAttractionWithScareRooms(2); // capacity = 2
      const state = makeState({
        staffHired: 5,
        staffAssignments: { 'haunt-1': 2 }, // already at capacity
        attractions: { 'haunt-1': attraction },
      });

      const result = assignStaffToAttraction(state, 'haunt-1');

      expect(result).toEqual({ ok: false, reason: 'attraction_at_capacity' });
    });

    it('respects HAUNT_STAFF_CAP even with many scare rooms', () => {
      const attraction = makeAttractionWithScareRooms(6); // 6 rooms, but cap is 4
      const state = makeState({
        staffHired: 10,
        staffAssignments: { 'haunt-1': HAUNT_STAFF_CAP }, // at cap
        attractions: { 'haunt-1': attraction },
      });

      const result = assignStaffToAttraction(state, 'haunt-1');

      expect(result).toEqual({ ok: false, reason: 'attraction_at_capacity' });
    });
  });

  describe('unassignStaffFromAttraction', () => {
    it('unassigns one staff from attraction', () => {
      const attraction = makeAttractionWithScareRooms(2);
      const state = makeState({
        staffHired: 3,
        staffAssignments: { 'haunt-1': 2 },
        attractions: { 'haunt-1': attraction },
      });

      const result = unassignStaffFromAttraction(state, 'haunt-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffAssignments['haunt-1']).toBe(1);
      }
    });

    it('removes entry when unassigning last staff', () => {
      const attraction = makeAttractionWithScareRooms(2);
      const state = makeState({
        staffHired: 3,
        staffAssignments: { 'haunt-1': 1 },
        attractions: { 'haunt-1': attraction },
      });

      const result = unassignStaffFromAttraction(state, 'haunt-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.staffAssignments['haunt-1']).toBeUndefined();
      }
    });

    it('fails if no staff assigned to attraction', () => {
      const attraction = makeAttractionWithScareRooms(2);
      const state = makeState({
        staffHired: 3,
        staffAssignments: {},
        attractions: { 'haunt-1': attraction },
      });

      const result = unassignStaffFromAttraction(state, 'haunt-1');

      expect(result).toEqual({ ok: false, reason: 'no_staff_assigned' });
    });

    it('fails if attraction does not exist', () => {
      const state = makeState({
        staffHired: 3,
        staffAssignments: { 'haunt-1': 2 },
        attractions: {},
      });

      const result = unassignStaffFromAttraction(state, 'haunt-1');

      expect(result).toEqual({ ok: false, reason: 'attraction_not_found' });
    });
  });
});
