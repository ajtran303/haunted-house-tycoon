import { useEffect, useState } from 'react';

import { MAX_VISITORS } from '../core/constants';
import { DEV_MODE, devConfig, setDevConfig } from '../dev/devMode';
import { useGameStore } from '../runtime/store';

// Persist haunt counter across re-renders
let globalHauntCounter = 1;

export const DevPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  const attractions = useGameStore((s) => s.attractions);

  // Reset haunt counter when game resets (attractions become empty)
  useEffect(() => {
    if (Object.keys(attractions).length === 0) {
      globalHauntCounter = 1;
    }
  }, [attractions]);

  const money = useGameStore((s) => s.money);
  const visitors = useGameStore((s) => s.visitors);
  const lifecycle = useGameStore((s) => s.lifecycle);
  const entrance = useGameStore((s) => s.entrance);
  const exit = useGameStore((s) => s.exit);

  // Force re-render when toggling config
  const [, forceUpdate] = useState(0);

  if (!DEV_MODE) return null;

  const handleToggle = <K extends keyof typeof devConfig>(key: K) => {
    const current = devConfig[key];
    if (typeof current === 'boolean') {
      setDevConfig(key, !current as (typeof devConfig)[K]);
      forceUpdate((n) => n + 1);
    }
  };

  const handleAddMoney = () => {
    useGameStore.setState((s) => ({ ...s, money: s.money + 1000 }));
  };

  const handleSpawnVisitors = () => {
    const s = useGameStore.getState();
    if (!s.entrance) return;

    const currentCount = s.visitors.length;
    const spawnCount = Math.min(10, MAX_VISITORS - currentCount);
    if (spawnCount <= 0) return;

    const newVisitors = [];
    for (let i = 0; i < spawnCount; i++) {
      newVisitors.push({
        id: s.nextVisitorId + i,
        position: { ...s.entrance },
        happiness: 50,
        fear: 0,
        intent: 'explore' as const,
        location: { type: 'midway' as const },
        spawnTick: s.tick,
      });
    }

    useGameStore.setState((st) => ({
      ...st,
      visitors: [...st.visitors, ...newVisitors],
      nextVisitorId: st.nextVisitorId + spawnCount,
    }));
  };

  const handleClearPark = () => {
    useGameStore.setState((s) => ({ ...s, visitors: [] }));
  };

  const handleAutoSetup = () => {
    const s = useGameStore.getState();
    if (s.entrance && s.exit) return; // Already set up

    const gridHeight = s.midwayGrid.length;
    const gridWidth = s.midwayGrid[0]?.length ?? 0;

    // Place park entry at top-left, exit at bottom-right
    if (!s.entrance) {
      s.dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });
      s.placeRoomAt(0, 0);
    }
    if (!s.exit) {
      s.dispatchInput({ type: 'selectRoomType', roomType: 'parkExit' });
      s.placeRoomAt(gridWidth - 1, gridHeight - 1);
    }
    s.dispatchInput({ type: 'selectRoomType', roomType: null });
  };

  const handleTemplateAttraction = () => {
    const s = useGameStore.getState();
    const num = globalHauntCounter;
    globalHauntCounter += 1;

    // Create attraction with pre-built layout
    const id = `attraction-${Date.now()}`;
    s.createAttraction(id, `Dev Haunt ${num}`, 8, 8);

    // Switch to attraction view to place rooms
    s.viewAttraction(id);

    // Place entry at (0, 3), hallway at (1, 3), scare at (2, 3), exit at (3, 3)
    s.dispatchInput({ type: 'selectRoomType', roomType: 'entry' });
    s.placeRoomAt(0, 3);
    s.dispatchInput({ type: 'selectRoomType', roomType: 'hallway' });
    s.placeRoomAt(1, 3);
    s.dispatchInput({ type: 'selectRoomType', roomType: 'scare' });
    s.placeRoomAt(2, 3);
    s.dispatchInput({ type: 'selectRoomType', roomType: 'exit' });
    s.placeRoomAt(3, 3);

    s.dispatchInput({ type: 'selectRoomType', roomType: null });
    s.viewMidway(); // Return to midway so user can place portal
  };

  const toggleBtn =
    'fixed bottom-2 left-2 z-50 rounded bg-gray-800 px-2 py-1 font-mono text-xs text-white opacity-50 hover:opacity-100';

  if (!isOpen) {
    return (
      <button className={toggleBtn} onClick={() => setIsOpen(true)}>
        DEV
      </button>
    );
  }

  return (
    <div className="fixed bottom-2 left-2 z-50 w-64 rounded border border-gray-600 bg-gray-900 p-3 font-mono text-xs text-white">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold">Dev Panel</span>
        <button className="text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
          [x]
        </button>
      </div>

      {/* Quick Info */}
      <div className="mb-2 text-gray-400">
        <div>Money: ${money}</div>
        <div>Visitors: {visitors.length}</div>
        <div>Status: {lifecycle}</div>
      </div>

      {/* Cheats */}
      <div className="mb-2 border-t border-gray-700 pt-2">
        <div className="mb-1 text-gray-500">Cheats</div>
        <div className="flex flex-wrap gap-1">
          <button
            className="rounded bg-gray-700 px-2 py-0.5 hover:bg-gray-600"
            onClick={handleAddMoney}
          >
            +$1000
          </button>
          <button
            className="rounded bg-gray-700 px-2 py-0.5 hover:bg-gray-600 disabled:opacity-50"
            onClick={handleSpawnVisitors}
            disabled={!entrance}
          >
            +10 Visitors
          </button>
          <button
            className="rounded bg-gray-700 px-2 py-0.5 hover:bg-gray-600"
            onClick={handleClearPark}
          >
            Clear Park
          </button>
        </div>
      </div>

      {/* Quick Setup */}
      <div className="mb-2 border-t border-gray-700 pt-2">
        <div className="mb-1 text-gray-500">Quick Setup</div>
        <div className="flex flex-wrap gap-1">
          <button
            className="rounded bg-gray-700 px-2 py-0.5 hover:bg-gray-600 disabled:opacity-50"
            onClick={handleAutoSetup}
            disabled={!!(entrance && exit)}
          >
            Auto Entry/Exit
          </button>
          <button
            className="rounded bg-gray-700 px-2 py-0.5 hover:bg-gray-600"
            onClick={handleTemplateAttraction}
          >
            + Template Haunt
          </button>
        </div>
      </div>

      {/* Debug Toggles */}
      <div className="border-t border-gray-700 pt-2">
        <div className="mb-1 text-gray-500">Debug</div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={devConfig.showVisitorIntent}
            onChange={() => handleToggle('showVisitorIntent')}
          />
          Show Visitor Intent
        </label>
      </div>

      {/* Console hint */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-gray-500">
        <div className="mb-1">Console:</div>
        <div className="text-xs leading-relaxed">
          __gameState() - get store
          <br />
          __tick() - advance 1 tick
          <br />
          __bootScene - Phaser scene
        </div>
      </div>
    </div>
  );
};
