import { ADMISSION_FEE } from '../../../src/core/constants';
import { spendingPerTick } from '../../../src/core/visitors/spending';
import { useGameStore } from '../../../src/runtime/store';

describe('Spending and Admission', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  const setEntrance = (x = 0, y = 0) => {
    useGameStore.setState({ entrance: { x, y } });
  };

  it('tick 1 spawns + charges admission only when entrance exists', () => {
    useGameStore.getState().startRun();

    const beforeNoEntrance = useGameStore.getState().money;
    useGameStore.getState().tickOnce(); // tick -> 1
    expect(useGameStore.getState().visitors.length).toBe(0);
    expect(useGameStore.getState().money).toBe(beforeNoEntrance);

    useGameStore.getState().newGame();
    useGameStore.getState().startRun();
    setEntrance(0, 0);

    const before = useGameStore.getState().money;
    useGameStore.getState().tickOnce(); // tick -> 1 (spawn tick)
    expect(useGameStore.getState().visitors.length).toBe(1);
    expect(useGameStore.getState().money).toBe(before + ADMISSION_FEE);
  });

  it('tickOnce does not charge admission when it is NOT a spawn tick (only spending applies)', () => {
    useGameStore.getState().startRun();
    setEntrance(0, 0);

    useGameStore.getState().tickOnce();
    const moneyAfterSpawn = useGameStore.getState().money;

    // non-spawn tick
    useGameStore.setState({ tick: 3 }); // nextTick=4
    const visitorBeforeTick = useGameStore.getState().visitors[0];

    useGameStore.getState().tickOnce();

    // Spending should equal spendingPerTick of the pre-existing visitor AFTER this tick's effects.
    // Easiest deterministic check: compute expected from the visitor *after* the tick (id stable).
    const visitorAfterTick = useGameStore
      .getState()
      .visitors.find((v) => v.id === visitorBeforeTick.id)!;
    const expectedSpend = spendingPerTick(visitorAfterTick);

    expect(useGameStore.getState().visitors.length).toBe(1);
    expect(useGameStore.getState().money).toBe(moneyAfterSpawn + expectedSpend);
  });

  it('spawn ticks always charge admission (example: tick 5), and spending uses visitorsBefore', () => {
    useGameStore.getState().startRun();
    setEntrance(0, 0);

    // tick 1 spawn
    useGameStore.getState().tickOnce();

    // advance to tick 4
    useGameStore.getState().tickOnce(); // 2
    useGameStore.getState().tickOnce(); // 3
    useGameStore.getState().tickOnce(); // 4

    const beforeTick5Money = useGameStore.getState().money;
    const visitorsBeforeTick5 = useGameStore.getState().visitors.slice(); // snapshot visitors

    useGameStore.getState().tickOnce(); // tick 5: spawn + admission + spending for existing visitors

    const visitorsAfterTick5 = useGameStore.getState().visitors;

    // existing visitors are the ones with ids from snapshot
    const expectedSpend = visitorsBeforeTick5.reduce((sum, oldV) => {
      const nowV = visitorsAfterTick5.find((v) => v.id === oldV.id);
      if (!nowV) return sum; // if it exited (later logic), it wouldn't spend
      return sum + spendingPerTick(nowV);
    }, 0);

    expect(useGameStore.getState().visitors.length).toBe(visitorsBeforeTick5.length + 1);
    expect(useGameStore.getState().money).toBe(beforeTick5Money + ADMISSION_FEE + expectedSpend);
  });

  it('no spending when paused', () => {
    useGameStore.getState().startRun();
    setEntrance(0, 0);

    useGameStore.getState().tickOnce();
    useGameStore.getState().pause();

    const before = useGameStore.getState().money;
    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().money).toBe(before);
  });
});
