import { useGameStore } from '../../../src/runtime/store';

describe('visitor spawnTick', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('assigns spawnTick at spawn time (not always 0)', () => {
    const s = useGameStore.getState();

    s.startRun(); // must be running to place rooms via clickCell

    s.dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });
    s.dispatchInput({ type: 'clickCell', x: 0, y: 0 });

    expect(useGameStore.getState().entrance).toEqual({ x: 0, y: 0 });

    for (let i = 0; i < 10; i++) s.tickOnce();

    s.spawnVisitor();

    const after = useGameStore.getState();
    expect(after.visitors.length).toBeGreaterThan(0);

    const v = after.visitors[after.visitors.length - 1];
    expect(v.spawnTick).toBe(after.tick);
    expect(v.spawnTick).not.toBe(0);
  });
});
