import { useGameStore } from '../../../src/runtime/store';

describe('failure on bankruptcy', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('enters failed when money <= 0', () => {
    useGameStore.getState().startRun();

    // Force low money so upkeep will kill it next tick
    useGameStore.setState({ money: 1 });

    // Ensure there is upkeep: place one hallway tile directly (or via placement)
    const s = useGameStore.getState();
    const g = s.midwayGrid.map((row) => row.slice());
    g[0][0] = { ...g[0][0], occupied: true, roomType: 'hallway', roomId: 'h-1' };
    useGameStore.setState({ midwayGrid: g });

    useGameStore.getState().tickOnce();

    const after = useGameStore.getState();
    expect(after.money).toBe(0);
    expect(after.lifecycle).toBe('failed');
  });

  it('does not advance ticks when failed', () => {
    useGameStore.setState({ lifecycle: 'failed', tick: 10 });
    useGameStore.getState().tickOnce();
    expect(useGameStore.getState().tick).toBe(10);
  });
});
