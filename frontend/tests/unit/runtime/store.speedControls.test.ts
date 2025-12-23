import { useGameStore } from '../../../src/runtime/store';

describe('Speed controls', () => {
  beforeEach(() => useGameStore.getState().newGame());

  it('defaults to 1x', () => {
    expect(useGameStore.getState().speed).toBe(1);
  });

  it('sets 4x', () => {
    useGameStore.getState().setSpeed4x();
    expect(useGameStore.getState().speed).toBe(4);
  });
});
