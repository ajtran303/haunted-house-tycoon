import { beforeEach, describe, expect, it } from '@jest/globals';
import { useGameStore } from './gameStore';

describe('Game Store', () => {
  beforeEach(() => {
    const { tick, advanceTime } = useGameStore.getState();
    useGameStore.setState({
      day: 1,
      totalTime: 0,
      timeSinceLastTick: 0,
      money: 1000,
      visitors: 0,
      tick,
      advanceTime,
    });
  });

  it('increments totalTime and timeSinceLastTick when advanceTime is called', () => {
    const store = useGameStore.getState();

    expect(store.totalTime).toBe(0);
    expect(store.timeSinceLastTick).toBe(0);

    store.advanceTime(500);
    expect(useGameStore.getState().totalTime).toBe(500);
    expect(useGameStore.getState().timeSinceLastTick).toBe(500);

    store.advanceTime(250);
    expect(useGameStore.getState().totalTime).toBe(750);
    expect(useGameStore.getState().timeSinceLastTick).toBe(750);

    store.advanceTime(250);
    expect(useGameStore.getState().totalTime).toBe(1000);
    expect(useGameStore.getState().timeSinceLastTick).toBe(0);
  });

  it('increments day, visitors, and money on tick', () => {
    const store = useGameStore.getState();

    expect(store.day).toBe(1);
    expect(store.visitors).toBe(0);
    expect(store.money).toBe(1000);

    // Tick 1 → Day 2
    store.tick();
    let updated = useGameStore.getState();
    expect(updated.day).toBe(2);
    expect(updated.visitors).toBe(2);
    expect(updated.money).toBe(1000 + 2 * 100); // money from new visitors

    // Tick 2 → Day 3
    store.tick();
    updated = useGameStore.getState();
    expect(updated.day).toBe(3);
    expect(updated.visitors).toBe(4);
    expect(updated.money).toBe(1000 + 2 * 100 + 2 * 100); // cumulative money
  });

  it('auto-ticks when timeSinceLastTick reaches 1000 ms', () => {
    const store = useGameStore.getState();

    store.advanceTime(500);
    let updated = useGameStore.getState();
    expect(updated.totalTime).toBe(500);
    expect(updated.timeSinceLastTick).toBe(500);
    expect(updated.day).toBe(1);
    expect(updated.visitors).toBe(0);
    expect(updated.money).toBe(1000);

    store.advanceTime(500); // crosses 1000 ms → triggers tick
    updated = useGameStore.getState();
    expect(updated.totalTime).toBe(1000);
    expect(updated.timeSinceLastTick).toBe(0);
    expect(updated.day).toBe(2);
    expect(updated.visitors).toBe(2);
    expect(updated.money).toBe(1000 + 2 * 100);
  });

  it('handles multiple ticks if advanceTime > 1000 ms', () => {
    const store = useGameStore.getState();

    store.advanceTime(2500); // 2 full ticks + leftover 500ms
    const updated = useGameStore.getState();

    expect(updated.totalTime).toBe(2500);
    expect(updated.timeSinceLastTick).toBe(500);
    expect(updated.day).toBe(3); // 2 ticks applied
    expect(updated.visitors).toBe(4); // 2 visitors per tick
    expect(updated.money).toBe(1000 + 2 * 100 + 2 * 100); // money after 2 ticks
  });

  it('calculates money step-by-step over multiple ticks', () => {
    const store = useGameStore.getState();

    // Tick 1: advance 1000ms
    store.advanceTime(1000);
    let state = useGameStore.getState();
    expect(state.day).toBe(2);
    expect(state.visitors).toBe(2);
    expect(state.money).toBe(1000 + 2 * 100); // money from tick 1 visitors

    // Tick 2: advance 1000ms
    store.advanceTime(1000);
    state = useGameStore.getState();
    expect(state.day).toBe(3);
    expect(state.visitors).toBe(4);
    expect(state.money).toBe(1000 + 2 * 100 + 2 * 100); // money after tick 2 visitors

    // Partial tick: advance 500ms → no tick
    store.advanceTime(500);
    state = useGameStore.getState();
    expect(state.day).toBe(3);
    expect(state.visitors).toBe(4);
    expect(state.money).toBe(1000 + 2 * 100 + 2 * 100);
    expect(state.timeSinceLastTick).toBe(500);
  });
});
