import type { RoomType } from '../core/types';
import { useGameStore } from '../runtime/store';

// A small stable snapshot for determinism assertions.
// Keep it minimal and derived only from deterministic state.
export type DeterminismSnapshot = {
  day: number;
  tick: number;
  lifecycle: string;
  money: number;
  visitors: number;
};

export type DeterminismResult = {
  snapshot: DeterminismSnapshot;
  hash: string;
};

// Deterministic, no branching, no reactive logic.
// Only explicit actions + explicit tickOnce() calls.
export const runDeterminismScript = (): DeterminismResult => {
  const s = useGameStore.getState();

  // Reset to known baseline
  s.newGame();

  // Start the sim
  s.startRun();

  // Fixed sequence of actions (no conditions).
  // Place Park Entry, then a tiny attraction path, then Park Exit.
  const place = (roomType: RoomType, x: number, y: number) => {
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType });
    useGameStore.getState().dispatchInput({ type: 'clickCell', x, y });
  };

  // Grid coords should be valid for your default grid size.
  // Keep the layout simple and fixed.
  place('parkEntry', 0, 0);
  place('entry', 1, 0);
  place('hallway', 2, 0);
  place('scare', 3, 0);
  place('exit', 4, 0);
  place('parkExit', 5, 0);

  // Fixed tick count. No branching.
  const TICKS = 120;
  for (let i = 0; i < TICKS; i++) {
    useGameStore.getState().tickOnce();
  }

  const end = useGameStore.getState();

  const snapshot: DeterminismSnapshot = {
    day: end.day,
    tick: end.tick,
    lifecycle: end.lifecycle,
    money: end.money,
    visitors: end.visitors.length,
  };

  // Stable stringify order for hashing
  const canonical = JSON.stringify(snapshot);

  // Cheap deterministic hash (not crypto; good enough for “did state change”)
  const hash = fnv1a32(canonical);

  return { snapshot, hash };
};

// FNV-1a 32-bit hash for stable checksums across runs
const fnv1a32 = (str: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // unsigned hex
  return (h >>> 0).toString(16).padStart(8, '0');
};
