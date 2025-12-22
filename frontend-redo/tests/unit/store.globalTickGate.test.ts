import { selectSnapshot } from '../../src/runtime/snapshot';
import { useGameStore } from '../../src/runtime/store';

const snapshot = () => selectSnapshot(useGameStore.getState());

// invariant test for timeTicks.test.ts
describe('Ticking is globally gated by lifecycle', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('does not mutate state when lifecycle !== running', () => {
    // newGame should set paused
    expect(useGameStore.getState().lifecycle).not.toBe('running');

    const before = snapshot();

    useGameStore.getState().tickOnce();

    const after = snapshot();

    expect(after).toEqual(before);
  });

  it('does mutate time when lifecycle === running', () => {
    useGameStore.getState().startRun();

    const before = snapshot();

    useGameStore.getState().tickOnce();

    const after = snapshot();

    expect(after).not.toEqual(before);
    expect(after.tick).toBe(before.tick + 1);
  });
});
