import { useGameStore } from '../../src/runtime/store';

describe('time ticks in store', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('does nothing when paused', () => {
    const before = {
      tick: useGameStore.getState().tick,
      day: useGameStore.getState().day,
      lifecycle: useGameStore.getState().lifecycle,
    };

    useGameStore.getState().tickOnce();

    const after = {
      tick: useGameStore.getState().tick,
      day: useGameStore.getState().day,
      lifecycle: useGameStore.getState().lifecycle,
    };

    expect(after).toEqual(before);
  });

  it('increments tick when running', () => {
    useGameStore.getState().startRun();

    const beforeTick = useGameStore.getState().tick;
    const beforeDay = useGameStore.getState().day;

    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().tick).toBe(beforeTick + 1);
    expect(useGameStore.getState().day).toBe(beforeDay);
  });
});
