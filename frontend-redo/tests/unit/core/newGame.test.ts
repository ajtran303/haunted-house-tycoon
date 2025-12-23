import { newGame } from '../../../src/core/newGame';

describe('newGame', () => {
  it('is deterministic', () => {
    expect(newGame()).toEqual(newGame());
  });

  it('starts paused with ticks', () => {
    const state = newGame();

    expect(state.lifecycle).toBe('paused');
    expect(state.tick).toBe(0);
  });
});
