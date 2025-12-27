import { useMemo, useState } from 'react';

import { useGameStore } from '../runtime/store';
import { MoodLegend } from './MoodLegend';
import { RoomSelector } from './RoomSelector';
import { SpeedControls } from './SpeedControls';

export const Hud = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const currentView = useGameStore((s) => s.currentView);
  const attractions = useGameStore((s) => s.attractions);
  const visitors = useGameStore((s) => s.visitors);

  // Count visitors per attraction
  const visitorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of visitors) {
      if (v.location.type === 'attraction') {
        counts[v.location.attractionId] = (counts[v.location.attractionId] ?? 0) + 1;
      }
    }
    return counts;
  }, [visitors]);

  // Check if attraction is active (has entry and exit placed)
  const getAttractionStatus = (attraction: (typeof attractions)[string]) => {
    const { entryPoint, exitPoint, grid } = attraction;
    const entryCell = grid[entryPoint.y]?.[entryPoint.x];
    const exitCell = grid[exitPoint.y]?.[exitPoint.x];
    const hasEntry = entryCell?.roomType === 'entry';
    const hasExit = exitCell?.roomType === 'exit';
    return hasEntry && hasExit ? 'active' : 'inactive';
  };

  const newGame = useGameStore((s) => s.newGame);
  const viewMidway = useGameStore((s) => s.viewMidway);
  const viewAttraction = useGameStore((s) => s.viewAttraction);

  const [showBanner, setShowBanner] = useState(false);

  const handleNewGame = () => {
    newGame();
    setShowBanner(true);
  };

  const handleAttractionClick = (attractionId: string) => {
    viewAttraction(attractionId);
  };

  const isRunning = lifecycle === 'running';

  const resume = useGameStore((s) => s.resume);
  const pause = useGameStore((s) => s.pause);

  const buttonStyle =
    'mt-3 rounded border border-gray-600 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white active:translate-y-0.5';

  const buttonActiveStyle =
    'mt-3 rounded border border-gray-500 bg-gray-700 px-3 py-2 text-white active:translate-y-0.5';

  return (
    <div className="h-screen w-96 shrink-0 overflow-y-auto border-l border-gray-700 bg-gray-900 p-4 font-mono text-base text-white">
      {showBanner && (
        <div
          role="status"
          className="mb-3 flex items-center justify-between rounded border border-green-600 bg-green-900/30 px-3 py-2 text-green-400"
        >
          <span>New Game Started</span>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-2 text-green-400 hover:text-green-200"
          >
            [x]
          </button>
        </div>
      )}
      <div className="mb-2 text-xl font-bold">Haunted House Tycoon</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={buttonStyle} onClick={resume}>
          Start/Resume
        </button>
        <button className={buttonStyle} onClick={pause}>
          Pause
        </button>
        <button onClick={handleNewGame} className={buttonStyle}>
          Reset
        </button>
      </div>

      {isRunning && (
        <div className="mt-4">
          <SpeedControls />
        </div>
      )}

      {/* View Switcher - only shown when running */}
      {isRunning && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <div className="mb-2 text-sm font-bold text-gray-400">VIEW</div>
          <button
            className={currentView.type === 'midway' ? buttonActiveStyle : buttonStyle}
            onClick={viewMidway}
          >
            Midway
          </button>

          {/* List of attractions */}
          {Object.values(attractions).map((attraction) => {
            const status = getAttractionStatus(attraction);
            const count = visitorCounts[attraction.id] ?? 0;
            const isActive =
              currentView.type === 'attraction' && currentView.attractionId === attraction.id;

            return (
              <button
                key={attraction.id}
                className={`${isActive ? buttonActiveStyle : buttonStyle} flex w-full items-center justify-between`}
                onClick={() => handleAttractionClick(attraction.id)}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}
                    title={status}
                  />
                  {attraction.name}
                </span>
                <span className="text-sm text-gray-500">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Room Selector - only shown when running */}
      {isRunning && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <RoomSelector />
        </div>
      )}

      {/* Mood Legend - only shown when running */}
      {isRunning && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <MoodLegend />
        </div>
      )}
    </div>
  );
};
