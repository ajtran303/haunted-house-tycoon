import { useGameStore } from '../../../src/runtime/store';

describe('lifecycle actions', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('pause sets lifecycle to paused', () => {
    useGameStore.getState().startRun();
    expect(useGameStore.getState().lifecycle).toBe('running');

    useGameStore.getState().pause();
    expect(useGameStore.getState().lifecycle).toBe('paused');
  });
});
