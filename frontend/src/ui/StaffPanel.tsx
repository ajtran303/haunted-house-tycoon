import { useMemo } from 'react';

import { MAX_STAFF, STAFF_HIRE_COST } from '../core/constants';
import { calculateStaffFearBonus, getAttractionStaffCapacity } from '../core/staff';
import { useGameStore } from '../runtime/store';

export const StaffPanel = () => {
  const staffHired = useGameStore((s) => s.staffHired);
  const staffAssignments = useGameStore((s) => s.staffAssignments);
  const money = useGameStore((s) => s.money);
  const attractions = useGameStore((s) => s.attractions);

  const hireStaff = useGameStore((s) => s.hireStaff);
  const fireStaff = useGameStore((s) => s.fireStaff);
  const assignStaff = useGameStore((s) => s.assignStaff);
  const unassignStaff = useGameStore((s) => s.unassignStaff);

  const totalAssigned = useMemo(() => {
    return Object.values(staffAssignments).reduce((sum, n) => sum + n, 0);
  }, [staffAssignments]);

  const unassignedStaff = staffHired - totalAssigned;

  const canHire = money >= STAFF_HIRE_COST && staffHired < MAX_STAFF;
  const canFire = staffHired > 0;

  // Get attractions with their capacities
  const attractionList = useMemo(() => {
    return Object.values(attractions).map((attraction) => {
      const capacity = getAttractionStaffCapacity(attraction);
      const assigned = staffAssignments[attraction.id] ?? 0;
      const fearBonus = calculateStaffFearBonus(assigned);
      return {
        id: attraction.id,
        name: attraction.name,
        capacity,
        assigned,
        fearBonus,
      };
    });
  }, [attractions, staffAssignments]);

  const buttonBase = 'px-2 py-1 text-sm rounded border transition-colors';
  const buttonEnabled = 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white';
  const buttonDisabled = 'border-gray-700 text-gray-600 cursor-not-allowed';

  return (
    <div>
      <div className="mb-2 text-sm font-bold text-gray-400">STAFF</div>

      {/* Hire/Fire Controls */}
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm">
          {staffHired}/{MAX_STAFF}
        </span>
        <button
          className={`${buttonBase} ${canHire ? buttonEnabled : buttonDisabled}`}
          onClick={hireStaff}
          disabled={!canHire}
        >
          Hire ${STAFF_HIRE_COST}
        </button>
        <button
          className={`${buttonBase} ${canFire ? buttonEnabled : buttonDisabled}`}
          onClick={fireStaff}
          disabled={!canFire}
        >
          Fire
        </button>
      </div>

      {/* Unassigned count */}
      <div className="mb-2 text-sm text-gray-400">
        Unassigned: <span className="text-white">{unassignedStaff}</span>
      </div>

      {/* Per-attraction assignment */}
      {attractionList.length > 0 && (
        <div className="space-y-2">
          {attractionList.map((attr) => {
            const canAssign = unassignedStaff > 0 && attr.assigned < attr.capacity;
            const canUnassign = attr.assigned > 0;

            return (
              <div
                key={attr.id}
                className="flex items-center justify-between rounded border border-gray-700 bg-gray-800 px-2 py-1.5"
              >
                <div className="flex flex-col">
                  <span className="text-sm">{attr.name}</span>
                  {attr.fearBonus > 0 && (
                    <span className="text-xs text-orange-400">+{attr.fearBonus} fear</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {attr.assigned}/{attr.capacity}
                  </span>
                  <button
                    className={`${buttonBase} ${canUnassign ? buttonEnabled : buttonDisabled}`}
                    onClick={() => unassignStaff(attr.id)}
                    disabled={!canUnassign}
                  >
                    -
                  </button>
                  <button
                    className={`${buttonBase} ${canAssign ? buttonEnabled : buttonDisabled}`}
                    onClick={() => assignStaff(attr.id)}
                    disabled={!canAssign}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {attractionList.length === 0 && (
        <div className="text-sm text-gray-500">No attractions yet</div>
      )}
    </div>
  );
};
