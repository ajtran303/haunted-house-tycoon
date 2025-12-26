import { useState } from 'react';

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
          <div className="flex gap-2">
            <button
              className={btn(selected === 'entry')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'entry' })}
            >
              Entry
            </button>
            <button
              className={btn(selected === 'exit')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'exit' })}
            >
              Exit
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className={btn(selected === 'hallway')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'hallway' })}
            >
              Hallway
            </button>
            <button
              className={btn(selected === 'scare')}
              onClick={() => dispatch({ type: 'selectRoomType', roomType: 'scare' })}
            >
              Scare
            </button>
          </div>
        </>
      )}

      <div className="mt-2">
        Selected: <span className="font-mono">{selected}</span>
      </div>
      <div className="text-xs text-gray-600">
        View: {currentView.type === 'midway' ? 'Midway' : `Attraction ${currentView.attractionId}`}
      </div>
    </div>
  );
};
