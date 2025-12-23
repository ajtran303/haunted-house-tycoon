import { ADMISSION_FEE } from '../../../src/core/constants';
import { useGameStore } from '../../../src/runtime/store';

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
    const beforeVisitors = useGameStore.getState().visitors.length;
    const beforeMoney = useGameStore.getState().money;

    const afterMoney = beforeMoney + beforeVisitors * ADMISSION_FEE;

    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().tick).toBe(beforeTick + 1);
    expect(useGameStore.getState().day).toBe(beforeDay);
    expect(useGameStore.getState().money).toBe(afterMoney + 10); // gain money from first admission
  });
});
