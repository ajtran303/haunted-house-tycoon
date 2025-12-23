import { consumeTicks } from '../../../src/core/accumulator';

describe('consumeTicks', () => {
  it('returns 0 ticks when total < msPerTick', () => {
    const r = consumeTicks({ accumulatedMs: 0, deltaMs: 250, msPerTick: 1000 });
    expect(r).toEqual({ ticksToProcess: 0, remainderMs: 250 });
  });

  it('returns 1 tick when total == msPerTick', () => {
    const r = consumeTicks({ accumulatedMs: 0, deltaMs: 1000, msPerTick: 1000 });
    expect(r).toEqual({ ticksToProcess: 1, remainderMs: 0 });
  });

  it('carries remainder across frames', () => {
    // previous remainder 750ms + new 400ms = 1150ms => 1 tick, 150ms remainder
    const r = consumeTicks({ accumulatedMs: 750, deltaMs: 400, msPerTick: 1000 });
    expect(r).toEqual({ ticksToProcess: 1, remainderMs: 150 });
  });

  it('processes multiple ticks when delta is large', () => {
    // 2500ms at 1000ms/tick => 2 ticks, 500ms remainder
    const r = consumeTicks({ accumulatedMs: 0, deltaMs: 2500, msPerTick: 1000 });
    expect(r).toEqual({ ticksToProcess: 2, remainderMs: 500 });
  });

  it('supports fast speed by lowering msPerTick (e.g. 4x)', () => {
    // 4x speed => 250ms/tick
    const r = consumeTicks({ accumulatedMs: 0, deltaMs: 1000, msPerTick: 250 });
    expect(r).toEqual({ ticksToProcess: 4, remainderMs: 0 });
  });

  it('does not lose precision with uneven remainder at 4x', () => {
    // 999ms at 250ms/tick => 3 ticks (750ms), 249ms remainder
    const r = consumeTicks({ accumulatedMs: 0, deltaMs: 999, msPerTick: 250 });
    expect(r).toEqual({ ticksToProcess: 3, remainderMs: 249 });
  });

  it('throws if msPerTick <= 0', () => {
    expect(() => consumeTicks({ accumulatedMs: 0, deltaMs: 16, msPerTick: 0 })).toThrow();
  });

  it('throws if deltaMs is negative', () => {
    expect(() => consumeTicks({ accumulatedMs: 0, deltaMs: -1, msPerTick: 1000 })).toThrow();
  });

  it('throws if accumulatedMs is negative', () => {
    expect(() => consumeTicks({ accumulatedMs: -1, deltaMs: 16, msPerTick: 1000 })).toThrow();
  });
});
