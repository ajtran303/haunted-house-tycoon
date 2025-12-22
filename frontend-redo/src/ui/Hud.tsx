import { useState } from 'react';

import { useGameStore } from '../runtime/store';

export const Hud = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const day = useGameStore((s) => s.day);
  const tick = useGameStore((s) => s.tick);
  const money = useGameStore((s) => s.money);
  const visitorCount = useGameStore((s) => s.visitors.length);
  const newGame = useGameStore((s) => s.newGame);

  const [showBanner, setShowBanner] = useState(false);

  const handleNewGame = () => {
    newGame();
    setShowBanner(true);
  };

  return (
    <div className="fixed top-2 left-2 border bg-white p-2 text-sm">
      {showBanner && (
        <div role="status" className="mb-2 border border-black px-2 py-1">
          New Game Started
        </div>
      )}
      <div className="mb-1 font-bold">Haunted House Tycoon</div>

      <div>Lifecycle: {lifecycle}</div>
      <div>Day: {day}</div>
      <div>Tick: {tick}</div>
      <div>Money: ${money}</div>
      <div>Visitors: {visitorCount}</div>

      <button
        onClick={handleNewGame}
        className="mt-2 border px-2 py-1 hover:bg-gray-100 hover:text-gray-900 active:translate-y-0.5 active:shadow-md"
      >
        New Game
      </button>
    </div>
  );
};
