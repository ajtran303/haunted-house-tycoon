// tests/unit/runtime/store.timeOfDayGate.test.ts
import { getTimeOfDay } from '../../../src/core/timeOfDay';
import { useGameStore } from '../../../src/runtime/store';

describe('timeOfDay respects lifecycle gate (via tickOnce)', () => {
  beforeEach(() => useGameStore.getState().newGame());

  it('does not change timeOfDay when paused', () => {
    const before = getTimeOfDay(useGameStore.getState().tick);

    // paused -> should no-op
    useGameStore.getState().tickOnce();

    const after = getTimeOfDay(useGameStore.getState().tick);
    expect(after).toBe(before);
  });
});
