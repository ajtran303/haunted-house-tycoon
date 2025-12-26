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

  it('returns fresh object each call (no shared references)', () => {
    const state1 = newGame();
    const state2 = newGame();

    expect(state1).not.toBe(state2);
    expect(state1.midwayGrid).not.toBe(state2.midwayGrid);
    expect(state1.attractions).not.toBe(state2.attractions);
    expect(state1.visitors).not.toBe(state2.visitors);
  });

  it('mutations to returned state do not affect subsequent calls', () => {
    const state1 = newGame();

    // Mutate state1
    state1.money = 0;
    state1.attractions['test'] = {
      id: 'test',
      name: 'Test',
      grid: [],
      entryPoint: { x: 0, y: 0 },
      exitPoint: { x: 1, y: 1 },
    };
    state1.visitors.push({
      id: 999,
      position: { x: 0, y: 0 },
      prevPos: null,
      location: { type: 'midway' },
      returnPortalPos: null,
      fear: 0,
      happiness: 50,
      intent: 'explore',
      spawnTick: 0,
      exploreStartTick: 0,
      blockingState: null,
    });
    state1.midwayGrid[0][0] = { ...state1.midwayGrid[0][0], occupied: true };

    // New state should be fresh
    const state2 = newGame();

    expect(state2.money).toBeGreaterThan(0);
    expect(state2.attractions).toEqual({});
    expect(state2.visitors).toEqual([]);
    expect(state2.midwayGrid[0][0].occupied).toBe(false);
  });

  it('resets view to midway', () => {
    const state = newGame();
    expect(state.currentView).toEqual({ type: 'midway' });
  });

  it('clears all attraction state', () => {
    const state = newGame();
    expect(state.attractions).toEqual({});
    expect(state.targetAttractionId).toBeNull();
  });
});
