import { useState } from 'react';

import { ROOM_COST } from '../core/constants';
import { useGameStore } from '../runtime/store';

export const RoomSelector = () => {
  const selected = useGameStore((s) => s.selectedRoomType);
  const dispatch = useGameStore((s) => s.dispatchInput);
  const currentView = useGameStore((s) => s.currentView);
  const entrance = useGameStore((s) => s.entrance);
  const exit = useGameStore((s) => s.exit);
  const attractions = useGameStore((s) => s.attractions);
  const midwayGrid = useGameStore((s) => s.midwayGrid);
  const targetAttractionId = useGameStore((s) => s.targetAttractionId);
  const setTargetAttraction = useGameStore((s) => s.setTargetAttraction);
  const createAttraction = useGameStore((s) => s.createAttraction);

  // Check which attractions already have portals placed
  const attractionsWithPortals = new Set<string>();
  for (const row of midwayGrid) {
    for (const cell of row) {
      if (cell.roomType === 'attractionPortal' && cell.portalTo) {
        attractionsWithPortals.add(cell.portalTo);
      }
    }
  }

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAttractionName, setNewAttractionName] = useState('');
  const [nextAttractionId, setNextAttractionId] = useState(1);

  const btnBase = 'mt-2 rounded border px-3 py-2 text-sm';
  const btnInactive = `${btnBase} border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white`;
  const btnActive = `${btnBase} border-gray-500 bg-gray-700 text-white`;

  const btn = (active: boolean) => (active ? btnActive : btnInactive);

  const inMidway = currentView.type === 'midway';
  const inAttraction = currentView.type === 'attraction';

  // Check if current attraction has entry/exit placed
  const currentAttraction =
    inAttraction && currentView.type === 'attraction'
      ? attractions[currentView.attractionId]
      : null;

  const hasAttractionEntry = (() => {
    if (!currentAttraction) return false;
    const { entryPoint, grid } = currentAttraction;
    const cell = grid[entryPoint.y]?.[entryPoint.x];
    return cell?.roomType === 'entry';
  })();

  const hasAttractionExit = (() => {
    if (!currentAttraction) return false;
    const { exitPoint, grid } = currentAttraction;
    const cell = grid[exitPoint.y]?.[exitPoint.x];
    return cell?.roomType === 'exit';
  })();

  const handleCreateAttractionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttractionName.trim()) return;

    const id = `attraction-${nextAttractionId}`;
    createAttraction(id, newAttractionName.trim(), 8, 8);
    setNextAttractionId((prev) => prev + 1);
    setNewAttractionName('');
    setShowCreateForm(false);
  };

  const handlePortalSelect = (attractionId: string) => {
    setTargetAttraction(attractionId);
    dispatch({ type: 'selectRoomType', roomType: 'attractionPortal' });
  };

  return (
    <div>
      <div className="mb-2 text-sm font-bold text-gray-400">BUILD</div>

      {/* Park Entry/Exit - only show on midway if not placed yet */}
      {inMidway && (!entrance || !exit) && (
        <div className="flex gap-2">
          {!entrance && (
            <button
              className={btn(selected === 'parkEntry')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'parkEntry' })}
            >
              Park Entry
            </button>
          )}
          {!exit && (
            <button
              className={btn(selected === 'parkExit')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'parkExit' })}
            >
              Park Exit
            </button>
          )}
        </div>
      )}

      {/* Create Attraction - only show on midway after park entry/exit placed */}
      {inMidway && entrance && exit && (
        <div className="mt-3">
          {!showCreateForm ? (
            <button className={btnInactive} onClick={() => setShowCreateForm(true)}>
              + Create Attraction
            </button>
          ) : (
            <form
              onSubmit={handleCreateAttractionSubmit}
              className="rounded border border-gray-600 p-3"
            >
              <input
                type="text"
                value={newAttractionName}
                onChange={(e) => setNewAttractionName(e.target.value)}
                placeholder="Attraction name..."
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
                autoFocus
              />
              <div className="mt-2 flex gap-2">
                <button type="submit" className={btnInactive}>
                  Create
                </button>
                <button
                  type="button"
                  className={btnInactive}
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewAttractionName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Portal buttons - one per attraction without a portal, only show on midway */}
      {inMidway &&
        Object.values(attractions).filter((a) => !attractionsWithPortals.has(a.id)).length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-sm text-gray-500">Portals:</div>
            {Object.values(attractions)
              .filter((attraction) => !attractionsWithPortals.has(attraction.id))
              .map((attraction) => (
                <button
                  key={attraction.id}
                  className={btn(
                    selected === 'attractionPortal' && targetAttractionId === attraction.id,
                  )}
                  onClick={() => handlePortalSelect(attraction.id)}
                >
                  Portal → {attraction.name}
                </button>
              ))}
          </div>
        )}

      {/* Amenities - midway only, after park entry/exit placed */}
      {inMidway && entrance && exit && (
        <div className="mt-3">
          <div className="mb-1 text-sm text-gray-500">Amenities:</div>
          <div className="flex flex-wrap gap-1">
            <button
              className={btn(selected === 'foodStall')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'foodStall' })}
            >
              Food ${ROOM_COST.foodStall}
            </button>
            <button
              className={btn(selected === 'giftShop')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'giftShop' })}
            >
              Gift ${ROOM_COST.giftShop}
            </button>
            <button
              className={btn(selected === 'restroom')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'restroom' })}
            >
              WC ${ROOM_COST.restroom}
            </button>
            <button
              className={btn(selected === 'photoBooth')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'photoBooth' })}
            >
              Photo ${ROOM_COST.photoBooth}
            </button>
            <button
              className={btn(selected === 'arcade')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'arcade' })}
            >
              Arcade ${ROOM_COST.arcade}
            </button>
            <button
              className={btn(selected === 'firstAid')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'firstAid' })}
            >
              Aid ${ROOM_COST.firstAid}
            </button>
          </div>
        </div>
      )}

      {/* Attraction tiles - only show in attraction view */}
      {inAttraction && (
        <>
          {/* Entry/Exit buttons - hide after placed */}
          {(!hasAttractionEntry || !hasAttractionExit) && (
            <div className="flex gap-2">
              {!hasAttractionEntry && (
                <button
                  className={btn(selected === 'entry')}
                  onClick={() => dispatch({ type: 'selectRoomType', roomType: 'entry' })}
                >
                  Entry ${ROOM_COST.entry}
                </button>
              )}
              {!hasAttractionExit && (
                <button
                  className={btn(selected === 'exit')}
                  onClick={() => dispatch({ type: 'selectRoomType', roomType: 'exit' })}
                >
                  Exit ${ROOM_COST.exit}
                </button>
              )}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <button
              className={btn(selected === 'hallway')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'hallway' })}
            >
              Hallway ${ROOM_COST.hallway}
            </button>
            <button
              className={btn(selected === 'scare')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'scare' })}
            >
              Scare ${ROOM_COST.scare}
            </button>
          </div>
        </>
      )}

      {/* Selected indicator */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Selected:</span>
        <span className="text-gray-300">{selected ?? 'none'}</span>
        {selected && (
          <button
            className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
            onClick={() => dispatch({ type: 'selectRoomType', roomType: null })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
