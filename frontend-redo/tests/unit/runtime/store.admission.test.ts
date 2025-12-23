import { ADMISSION_FEE } from '../../../src/core/constants';
import { selectSnapshot } from '../../../src/runtime/snapshot';
import { useGameStore } from '../../../src/runtime/store';

describe('Admission spend event', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('charges admission when a visitor enters', () => {
    const before = selectSnapshot(useGameStore.getState());

    useGameStore.getState().spawnVisitorAtEntrance();

    const after = useGameStore.getState();
    expect(after.visitors.length).toBe(before.visitors.length + 1);
    expect(after.money).toBe(before.money + ADMISSION_FEE);
  });

  it('tickOnce does not change money', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnVisitorAtEntrance();

    const beforeMoney = useGameStore.getState().money;

    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().money).toBe(beforeMoney);
  });

  it('does not charge admission on tickOnce', () => {
    const s = useGameStore.getState();

    s.spawnVisitorAtEntrance();
    const moneyAfterSpawn = useGameStore.getState().money;

    s.startRun();
    s.tickOnce();

    expect(useGameStore.getState().money).toBe(moneyAfterSpawn);
  });
});
