// tests/unit/core/timeOfDay.test.ts
import { NIGHT_START_TICK, TICKS_PER_DAY } from '../../../src/core/constants';
import { getTickInDay, getTimeOfDay } from '../../../src/core/timeOfDay';

describe('timeOfDay', () => {
  it('computes tickInDay via modulo', () => {
    expect(getTickInDay(0)).toBe(0);
    expect(getTickInDay(TICKS_PER_DAY - 1)).toBe(TICKS_PER_DAY - 1);
    expect(getTickInDay(TICKS_PER_DAY)).toBe(0);
    expect(getTickInDay(TICKS_PER_DAY + 5)).toBe(5);
  });

  it('is day before halfway, night at halfway', () => {
    expect(getTimeOfDay(NIGHT_START_TICK - 1)).toBe('day');
    expect(getTimeOfDay(NIGHT_START_TICK)).toBe('night');
  });

  it('returns day again after day rollover', () => {
    // last tick of day -> night (since halfway already passed)
    expect(getTimeOfDay(TICKS_PER_DAY - 1)).toBe('night');
    // rollover to next day -> day
    expect(getTimeOfDay(TICKS_PER_DAY)).toBe('day');
  });
});
