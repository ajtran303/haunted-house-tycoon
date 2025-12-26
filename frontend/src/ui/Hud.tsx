import { useState } from 'react';

import { getTimeOfDay } from '../core/timeOfDay';
import { useGameStore } from '../runtime/store';
import { RoomSelector } from './RoomSelector';
import { SpeedControls } from './SpeedControls';

export const Hud = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const day = useGameStore((s) => s.day);
  const tick = useGameStore((s) => s.tick);
  const money = useGameStore((s) => s.money);
  const visitorCount = useGameStore((s) => s.visitors.length);
  const timeOfDay = getTimeOfDay(tick);
  const currentView = useGameStore((s) => s.currentView);
  const attractions = useGameStore((s) => s.attractions);

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

  const resume = useGameStore((s) => s.resume);

  const pause = useGameStore((s) => s.pause);

  const buttonStyle =
    'mt-2 border px-2 py-1 hover:bg-gray-100 hover:text-gray-900 active:translate-y-0.5 active:shadow-md';

  const hudStyle = 'fixed top-0 right-0 h-full w-64 border-l bg-white p-3 text-sm overflow-y-auto';

  return (
    <div className={hudStyle}>
      {showBanner && (
        <div role="status" className="mb-2 border border-black px-2 py-1">
          New Game Started
        </div>
      )}
      <button onClick={handleNewGame} className={buttonStyle}>
        New Game
      </button>
      <div className="mb-1 font-bold">Haunted House Tycoon</div>
      <div>Lifecycle: {lifecycle}</div>
      <div>Day: {day}</div>
      <div>Time: {timeOfDay}</div>
      <div>Tick: {tick}</div>
      <div>Money: ${money}</div>
      <div>Visitors: {visitorCount}</div>
      <br />
      <button className={buttonStyle} onClick={resume}>
        Start/Resume
      </button>
      <button className={buttonStyle} onClick={pause}>
        Pause
      </button>
      <br />
      <br />
      <SpeedControls />
      <br />

      {/* View Switcher */}
      <div className="mb-2 border-t pt-2">
        <div className="mb-1 font-bold">View</div>
        <button
          className={`${buttonStyle} ${currentView.type === 'midway' ? 'bg-gray-200' : ''}`}
          onClick={viewMidway}
        >
          Midway
        </button>

        {/* List of attractions */}
        {Object.values(attractions).map((attraction) => (
          <button
            key={attraction.id}
            className={`${buttonStyle} ${currentView.type === 'attraction' && currentView.attractionId === attraction.id ? 'bg-gray-200' : ''}`}
            onClick={() => handleAttractionClick(attraction.id)}
          >
            {attraction.name}
          </button>
        ))}
      </div>

      <br />
      <RoomSelector />
    </div>
  );
};
