import { MAX_STAFF, STAFF_HIRE_COST, HAUNT_STAFF_CAP } from './constants';
import type { AttractionGrid, GameState } from './types';

export type HireStaffResult =
  | { ok: true; staffHired: number; money: number }
  | { ok: false; reason: 'insufficient_funds' | 'max_staff_reached' };

export type FireStaffResult =
  | { ok: true; staffHired: number; money: number; staffAssignments: Record<string, number> }
  | { ok: false; reason: 'no_staff_to_fire' };

export const hireStaff = (state: GameState): HireStaffResult => {
  if (state.staffHired >= MAX_STAFF) {
    return { ok: false, reason: 'max_staff_reached' };
  }

  if (state.money < STAFF_HIRE_COST) {
    return { ok: false, reason: 'insufficient_funds' };
  }

  return {
    ok: true,
    staffHired: state.staffHired + 1,
    money: state.money - STAFF_HIRE_COST,
  };
};

export const fireStaff = (state: GameState): FireStaffResult => {
  if (state.staffHired <= 0) {
    return { ok: false, reason: 'no_staff_to_fire' };
  }

  const newStaffHired = state.staffHired - 1;

  // Calculate total currently assigned
  const totalAssigned = Object.values(state.staffAssignments).reduce((sum, n) => sum + n, 0);

  // If we still have enough staff for all assignments, no changes needed
  if (totalAssigned <= newStaffHired) {
    return {
      ok: true,
      staffHired: newStaffHired,
      money: state.money,
      staffAssignments: { ...state.staffAssignments },
    };
  }

  // Need to unassign (totalAssigned - newStaffHired) staff
  const toUnassign = totalAssigned - newStaffHired;
  const newAssignments = { ...state.staffAssignments };

  let remaining = toUnassign;
  // Unassign from attractions in order (deterministic)
  const attractionIds = Object.keys(newAssignments).sort();

  for (const id of attractionIds) {
    if (remaining <= 0) break;

    const current = newAssignments[id] ?? 0;
    const reduction = Math.min(current, remaining);
    newAssignments[id] = current - reduction;
    remaining -= reduction;

    // Clean up zero entries
    if (newAssignments[id] === 0) {
      delete newAssignments[id];
    }
  }

  return {
    ok: true,
    staffHired: newStaffHired,
    money: state.money,
    staffAssignments: newAssignments,
  };
};

export const getAttractionStaffCapacity = (attraction: AttractionGrid): number => {
  let scareRoomCount = 0;

  for (const row of attraction.grid) {
    for (const cell of row) {
      if (cell.roomType === 'scare') {
        scareRoomCount++;
      }
    }
  }

  return Math.min(HAUNT_STAFF_CAP, scareRoomCount);
};

export type AssignStaffResult =
  | { ok: true; staffAssignments: Record<string, number> }
  | { ok: false; reason: 'attraction_not_found' | 'no_unassigned_staff' | 'attraction_at_capacity' };

export type UnassignStaffResult =
  | { ok: true; staffAssignments: Record<string, number> }
  | { ok: false; reason: 'attraction_not_found' | 'no_staff_assigned' };

export const assignStaffToAttraction = (
  state: GameState,
  attractionId: string,
): AssignStaffResult => {
  const attraction = state.attractions[attractionId];
  if (!attraction) {
    return { ok: false, reason: 'attraction_not_found' };
  }

  // Check if there are unassigned staff available
  const totalAssigned = Object.values(state.staffAssignments).reduce((sum, n) => sum + n, 0);
  const unassigned = state.staffHired - totalAssigned;
  if (unassigned <= 0) {
    return { ok: false, reason: 'no_unassigned_staff' };
  }

  // Check attraction capacity
  const capacity = getAttractionStaffCapacity(attraction);
  const currentAssigned = state.staffAssignments[attractionId] ?? 0;
  if (currentAssigned >= capacity) {
    return { ok: false, reason: 'attraction_at_capacity' };
  }

  const newAssignments = { ...state.staffAssignments };
  newAssignments[attractionId] = currentAssigned + 1;

  return { ok: true, staffAssignments: newAssignments };
};

export const unassignStaffFromAttraction = (
  state: GameState,
  attractionId: string,
): UnassignStaffResult => {
  const attraction = state.attractions[attractionId];
  if (!attraction) {
    return { ok: false, reason: 'attraction_not_found' };
  }

  const currentAssigned = state.staffAssignments[attractionId] ?? 0;
  if (currentAssigned <= 0) {
    return { ok: false, reason: 'no_staff_assigned' };
  }

  const newAssignments = { ...state.staffAssignments };
  if (currentAssigned === 1) {
    delete newAssignments[attractionId];
  } else {
    newAssignments[attractionId] = currentAssigned - 1;
  }

  return { ok: true, staffAssignments: newAssignments };
};
