import { MAX_STAFF, STAFF_HIRE_COST } from './constants';
import type { GameState } from './types';

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
