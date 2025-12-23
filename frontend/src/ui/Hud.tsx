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

  const newGame = useGameStore((s) => s.newGame);

  const [showBanner, setShowBanner] = useState(false);

  const handleNewGame = () => {
    newGame();
    setShowBanner(true);
  };

  const startRun = useGameStore((s) => s.startRunWithInitialVisitor);

  const pause = useGameStore((s) => s.pause);

  const buttonStyle =
    'mt-2 border px-2 py-1 hover:bg-gray-100 hover:text-gray-900 active:translate-y-0.5 active:shadow-md';

  const hudStyle = 'fixed top-0 right-0 h-full w-64 border-l bg-white p-3 text-sm';

  return (
    <div className={hudStyle}>
      {showBanner && (
        <div role="status" className="mb-2 border border-black px-2 py-1">
          New Game Started
        </div>
      )}
      <div className="mb-1 font-bold">Haunted House Tycoon</div>
      <div>Lifecycle: {lifecycle}</div>
      <div>Day: {day}</div>
      <div>Time: {timeOfDay}</div>
      <div>Tick: {tick}</div>
      <div>Money: ${money}</div>
      <div>Visitors: {visitorCount}</div>
      <button onClick={handleNewGame} className={buttonStyle}>
        New Game
      </button>
      <button className={buttonStyle} onClick={startRun}>
        Start/Resume
      </button>
      <button className={buttonStyle} onClick={pause}>
        Pause
      </button>
      <br />
      <br />
      <SpeedControls />
      <br />
      <RoomSelector />
    </div>
  );
};
