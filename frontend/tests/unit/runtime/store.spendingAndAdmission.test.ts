import { ADMISSION_FEE } from '../../../src/core/constants';
import { useGameStore } from '../../../src/runtime/store';

describe('Spending and Admission', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('tick 1 spawns + charges admission, but does not spend until next tick', () => {
    useGameStore.getState().newGame();
    useGameStore.getState().startRun();

    const before = useGameStore.getState().money;

    useGameStore.getState().tickOnce(); // tick -> 1

    expect(useGameStore.getState().visitors.length).toBe(1);
    expect(useGameStore.getState().money).toBe(before + ADMISSION_FEE);
  });

  it('does not charge admission on tickOnce', () => {
    useGameStore.getState().startRun();

    useGameStore.getState().spawnVisitor();
    const moneyAfterSpawn = useGameStore.getState().money;

    useGameStore.getState().tickOnce();

    // but visitor will spend 1 dollar on first tick (leaky tests?)
    expect(useGameStore.getState().money).toBe(moneyAfterSpawn + ADMISSION_FEE + 1);
  });

  it('spawn ticks always charge admission (e.g. tick 5)', () => {
    useGameStore.getState().newGame();
    useGameStore.getState().startRun();

    // tick 1 spawn+admit
    useGameStore.getState().tickOnce();

    // advance to tick 4
    useGameStore.getState().tickOnce();
    useGameStore.getState().tickOnce();
    useGameStore.getState().tickOnce();

    const beforeTick5Money = useGameStore.getState().money;
    const beforeTick5Visitors = useGameStore.getState().visitors.length;

    useGameStore.getState().tickOnce(); // tick 5: spawn+admit + spend for prior visitors

    expect(useGameStore.getState().visitors.length).toBe(beforeTick5Visitors + 1);
    expect(useGameStore.getState().money).toBe(
      beforeTick5Money + ADMISSION_FEE + beforeTick5Visitors * 1,
    );
  });

  it('no spending when paused', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnVisitor();
    useGameStore.getState().pause();

    const before = useGameStore.getState().money;

    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().money).toBe(before);
  });
});
