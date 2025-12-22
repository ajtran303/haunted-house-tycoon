import { beforeEach, describe, expect, it } from '@jest/globals';

import { useGameStore } from './gameStore';

describe('Game Store', () => {
  beforeEach(() => {
    const { tick, advanceTime } = useGameStore.getState();

    useGameStore.setState({
      day: 1,
      timeElapsed: 0,
      money: 1000,
      visitors: 0,
      tick,
      advanceTime,
    });
  });

  it('increments day, visitors, and money on tick', () => {
    useGameStore.getState().tick();
    const state = useGameStore.getState();

    expect(state.day).toBe(2);
    expect(state.visitors).toBe(4);
    expect(state.money).toBe(1200);
  });
});
