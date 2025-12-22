import { TICKS_PER_DAY } from '../../src/core/constants';
import { applyTimeTick } from '../../src/core/time';

describe('applyTimeTick', () => {
  it('increments tick by 1', () => {
    const s = { tick: 0, day: 1 };
    expect(applyTimeTick(s)).toEqual({ tick: 1, day: 1 });
  });

  it('does not change day before a full day elapses', () => {
    const s = { tick: 1, day: 1 };
    expect(applyTimeTick(s).day).toEqual(1);
  });

  it('increments day when crossing a day boundary', () => {
    // Constant used here so test is flexible with future tuning
    const s = { tick: TICKS_PER_DAY - 1, day: 1 };
    expect(applyTimeTick(s)).toEqual({ tick: TICKS_PER_DAY, day: 2 });
  });

  it('is pure and does not mutate input', () => {
    const s = { tick: 0, day: 1 }; // initial input
    const copy = { ...s }; // copy of initial input

    applyTimeTick(s); // always returns a new object

    expect(s).toEqual(copy); // initial input is the same
  });
});
