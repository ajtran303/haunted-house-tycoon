import { ADMISSION_FEE, MONEY_PER_VISITOR_PER_TICK } from '../../../src/core/constants';
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

    // Without entrance: no spawn, no admission
    const beforeNoEntrance = useGameStore.getState().money;
    useGameStore.getState().tickOnce(); // tick -> 1
    expect(useGameStore.getState().visitors.length).toBe(0);
    expect(useGameStore.getState().money).toBe(beforeNoEntrance);

    // Reset, add entrance, then tick 1 should spawn + charge
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

    // Create 1 visitor now (charges admission once)
    useGameStore.getState().spawnVisitor();
    const moneyAfterSpawn = useGameStore.getState().money;

    // Move tick forward to a non-spawn tick.
    // Easiest: set tick so nextTick is NOT a spawn tick.
    // With TICKS_PER_VISITOR_SPAWN=5 and tick 3 -> nextTick 4 (not spawn).
    useGameStore.setState({ tick: 3 });

    useGameStore.getState().tickOnce(); // nextTick = 4 (no spawn)

    // No new admission, but spending for the 1 existing visitor applies
    expect(useGameStore.getState().visitors.length).toBe(1);
    expect(useGameStore.getState().money).toBe(moneyAfterSpawn + 1 * MONEY_PER_VISITOR_PER_TICK);
  });

  it('spawn ticks always charge admission (example: tick 5), and spending uses visitorsBefore', () => {
    useGameStore.getState().startRun();
    setEntrance(0, 0);

    // Tick 1: spawn + admission
    useGameStore.getState().tickOnce();

    // Advance to tick 4
    useGameStore.getState().tickOnce(); // 2
    useGameStore.getState().tickOnce(); // 3
    useGameStore.getState().tickOnce(); // 4

    const beforeTick5Money = useGameStore.getState().money;
    const visitorsBeforeTick5 = useGameStore.getState().visitors.length;

    useGameStore.getState().tickOnce(); // tick 5: spawn + admission + spending for visitorsBeforeTick5

    expect(useGameStore.getState().visitors.length).toBe(visitorsBeforeTick5 + 1);
    expect(useGameStore.getState().money).toBe(
      beforeTick5Money + ADMISSION_FEE + visitorsBeforeTick5 * MONEY_PER_VISITOR_PER_TICK,
    );
  });

  it('no spending when paused', () => {
    useGameStore.getState().startRun();
    setEntrance(0, 0);

    useGameStore.getState().spawnVisitor();
    useGameStore.getState().pause();

    const before = useGameStore.getState().money;
    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().money).toBe(before);
  });
});
