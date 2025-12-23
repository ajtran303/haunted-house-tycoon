// tests/unit/runtime/store.speedEquivalence.test.ts
import { selectSnapshot } from '../../../src/runtime/snapshot';
import { useGameStore } from '../../../src/runtime/store';

const snap = () => selectSnapshot(useGameStore.getState());

const runTicks = (n: number) => {
  for (let i = 0; i < n; i++) {
    useGameStore.getState().tickOnce();
  }
};

describe('Speed equivalence (tick-count based)', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
    useGameStore.getState().startRun();
  });

  it('produces identical state after the same number of ticks at 1x vs 4x', () => {
    useGameStore.getState().setSpeed1x();
    const before1x = snap();
    runTicks(50);
    const after1x = snap();

    useGameStore.getState().newGame();
    useGameStore.getState().startRun();
    useGameStore.getState().setSpeed4x();

    const before4x = snap();
    runTicks(50);
    const after4x = snap();

    // started identically
    expect(before4x).toEqual(before1x);

    // same ticks => same state
    expect(after4x).toEqual(after1x);
  });
});
