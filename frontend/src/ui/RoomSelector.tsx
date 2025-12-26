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

  const btn = (active: boolean) =>
    `mt-2 border px-2 py-1 ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`;

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
    <div className="top-2 right-2 border bg-white p-2 text-sm">
      <div className="mb-1 font-bold">Build</div>

      {/* Park Entry/Exit - only show on midway if not placed yet */}
      {inMidway && (
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

      {/* Amenities - midway only, after park entry/exit placed */}
      {inMidway && entrance && exit && (
        <div className="mt-2">
          <div className="text-xs text-gray-600">Amenities:</div>
          <div className="flex flex-wrap gap-1">
            <button
              className={btn(selected === 'foodStall')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'foodStall' })}
            >
              Food Stall (${ROOM_COST.foodStall})
            </button>
            <button
              className={btn(selected === 'giftShop')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'giftShop' })}
            >
              Gift Shop (${ROOM_COST.giftShop})
            </button>
            <button
              className={btn(selected === 'restroom')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'restroom' })}
            >
              Restroom (${ROOM_COST.restroom})
            </button>
            <button
              className={btn(selected === 'photoBooth')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'photoBooth' })}
            >
              Photo Booth (${ROOM_COST.photoBooth})
            </button>
            <button
              className={btn(selected === 'arcade')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'arcade' })}
            >
              Arcade (${ROOM_COST.arcade})
            </button>
            <button
              className={btn(selected === 'firstAid')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'firstAid' })}
            >
              First Aid (${ROOM_COST.firstAid})
            </button>
          </div>
        </div>
      )}

      {/* Create Attraction - only show on midway after park entry/exit placed */}
      {inMidway && entrance && exit && (
        <div className="mt-2">
          {!showCreateForm ? (
            <button className={btn(false)} onClick={() => setShowCreateForm(true)}>
              + Create Attraction
            </button>
          ) : (
            <form onSubmit={handleCreateAttractionSubmit} className="border p-2">
              <input
                type="text"
                value={newAttractionName}
                onChange={(e) => setNewAttractionName(e.target.value)}
                placeholder="Attraction name..."
                className="w-full border px-2 py-1 text-sm"
                autoFocus
              />
              <div className="mt-1 flex gap-1">
                <button type="submit" className={btn(false)}>
                  Create
                </button>
                <button
                  type="button"
                  className={btn(false)}
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
          <div className="mt-2">
            <div className="text-xs text-gray-600">Portals:</div>
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
                  Portal to "{attraction.name}"
                </button>
              ))}
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
                  Entry (${ROOM_COST.entry})
                </button>
              )}
              {!hasAttractionExit && (
                <button
                  className={btn(selected === 'exit')}
                  onClick={() => dispatch({ type: 'selectRoomType', roomType: 'exit' })}
                >
                  Exit (${ROOM_COST.exit})
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              className={btn(selected === 'hallway')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'hallway' })}
            >
              Hallway (${ROOM_COST.hallway})
            </button>
            <button
              className={btn(selected === 'scare')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'scare' })}
            >
              Scare (${ROOM_COST.scare})
            </button>
          </div>
        </>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span>
          Selected: <span className="font-mono">{selected ?? 'none'}</span>
        </span>
        {selected && (
          <button
            className="border px-2 py-0.5 text-xs hover:bg-gray-100"
            onClick={() => dispatch({ type: 'selectRoomType', roomType: null })}
          >
            ✕ Clear
          </button>
        )}
      </div>
      <div className="text-xs text-gray-600">
        View: {currentView.type === 'midway' ? 'Midway' : `Attraction ${currentView.attractionId}`}
      </div>
    </div>
  );
};
