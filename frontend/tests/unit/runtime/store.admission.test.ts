import { ADMISSION_FEE } from '../../../src/core/constants';
import { useGameStore } from '../../../src/runtime/store';

describe('Admission spend event', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('charges admission when a visitor enters', () => {
    useGameStore.getState().startRun();

    const beforeMoney = useGameStore.getState().money;
    const beforeVisitors = useGameStore.getState().visitors.length;
    const beforeNextId = useGameStore.getState().nextVisitorId;

    useGameStore.getState().spawnVisitorAtEntrance();

    const after = useGameStore.getState();

    expect(after.visitors.length).toBe(beforeVisitors + 1);
    expect(after.money).toBe(beforeMoney + ADMISSION_FEE);
    expect(after.nextVisitorId).toBe(beforeNextId + 1);
  });

  it('tickOnce does not change money', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().spawnVisitorAtEntrance();

    const beforeMoney = useGameStore.getState().money;

    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().money).not.toBe(beforeMoney + ADMISSION_FEE);
  });

  it('does not charge admission on tickOnce', () => {
    useGameStore.getState().startRun();

    useGameStore.getState().spawnVisitorAtEntrance();
    const moneyAfterSpawn = useGameStore.getState().money;

    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().money).not.toBe(moneyAfterSpawn + ADMISSION_FEE);
  });

  it('does not admit or charge when paused', () => {
    // newGame() leaves lifecycle = paused
    const beforeMoney = useGameStore.getState().money;
    const beforeVisitors = useGameStore.getState().visitors.length;
    const beforeNextId = useGameStore.getState().nextVisitorId;

    useGameStore.getState().spawnVisitorAtEntrance();

    const after = useGameStore.getState();

    expect(after.money).toBe(beforeMoney);
    expect(after.visitors.length).toBe(beforeVisitors);
    expect(after.nextVisitorId).toBe(beforeNextId);
    expect(after.lifecycle).toBe('paused');
  });

  it('admits + charges once when running', () => {
    useGameStore.getState().startRun();

    const beforeMoney = useGameStore.getState().money;
    const beforeVisitors = useGameStore.getState().visitors.length;

    useGameStore.getState().spawnVisitorAtEntrance();

    const after = useGameStore.getState();

    expect(after.visitors.length).toBe(beforeVisitors + 1);
    expect(after.money).toBe(beforeMoney + ADMISSION_FEE);
  });
});
