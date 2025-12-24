import {
  BASE_SPEND_PER_TICK,
  FEAR_PANIC_THRESHOLD,
  FEAR_SPEND_BOOST_CAP,
  FEAR_SPEND_BOOST_START,
  HAPPY_SPEND_BOOST_START,
  MAX_FEAR_BONUS_PER_TICK,
  MAX_HAPPY_BONUS_PER_TICK,
  UNHAPPY_SPEND_STOP,
} from '../constants';
import type { Visitor } from '../types';
import { spendingPerTick, totalSpendingPerTick } from './spending';

const makeVisitor = (overrides?: Partial<Visitor>): Visitor => ({
  id: 1,
  position: { x: 0, y: 0 },
  prevPos: null,
  inAttraction: false,
  fear: 0,
  happiness: 50,
  ...overrides,
});

describe('spendingPerTick', () => {
  it('is deterministic (same input => same output)', () => {
    const v = makeVisitor({ fear: 42, happiness: 77 });
    expect(spendingPerTick(v)).toBe(spendingPerTick(v));
    expect(spendingPerTick(v)).toBe(spendingPerTick({ ...v }));
  });

  it('stops spending when happiness is at or below the unhappy threshold', () => {
    expect(spendingPerTick(makeVisitor({ happiness: UNHAPPY_SPEND_STOP, fear: 0 }))).toBe(0);
    expect(spendingPerTick(makeVisitor({ happiness: UNHAPPY_SPEND_STOP - 1, fear: 0 }))).toBe(0);
  });

  it('stops spending when fear is at or above the panic threshold', () => {
    expect(spendingPerTick(makeVisitor({ fear: FEAR_PANIC_THRESHOLD, happiness: 100 }))).toBe(0);
    expect(spendingPerTick(makeVisitor({ fear: FEAR_PANIC_THRESHOLD + 1, happiness: 100 }))).toBe(
      0,
    );
  });

  it('happier visitors spend more (holding fear constant)', () => {
    // pick fear safely in the spending range (below panic)
    const safeFear = Math.min(FEAR_SPEND_BOOST_CAP, FEAR_PANIC_THRESHOLD - 1);

    const lowHappy = makeVisitor({ happiness: HAPPY_SPEND_BOOST_START, fear: safeFear });
    const highHappy = makeVisitor({ happiness: 100, fear: safeFear });

    expect(spendingPerTick(highHappy)).toBeGreaterThan(spendingPerTick(lowHappy));
  });

  it('fear increases spending up to the boost cap (holding happiness constant)', () => {
    // keep happiness above unhappy stop so spending is active
    const happy = Math.max(HAPPY_SPEND_BOOST_START, UNHAPPY_SPEND_STOP + 1);

    const lowFear = makeVisitor({ fear: FEAR_SPEND_BOOST_START, happiness: happy });
    const midFear = makeVisitor({
      fear: Math.floor((FEAR_SPEND_BOOST_START + FEAR_SPEND_BOOST_CAP) / 2),
      happiness: happy,
    });
    const capFear = makeVisitor({ fear: FEAR_SPEND_BOOST_CAP, happiness: happy });

    expect(spendingPerTick(midFear)).toBeGreaterThanOrEqual(spendingPerTick(lowFear));
    expect(spendingPerTick(capFear)).toBeGreaterThanOrEqual(spendingPerTick(midFear));
  });

  it('fear bonus is capped at MAX_FEAR_BONUS_PER_TICK (below panic)', () => {
    const happy = 100;

    // choose a fear value that is at/above cap but still below panic
    const fearAtOrAboveCapButBelowPanic = Math.min(
      FEAR_SPEND_BOOST_CAP + 100,
      FEAR_PANIC_THRESHOLD - 1,
    );

    const atCap = makeVisitor({ fear: FEAR_SPEND_BOOST_CAP, happiness: happy });
    const aboveCap = makeVisitor({ fear: fearAtOrAboveCapButBelowPanic, happiness: happy });

    // Above-cap fear should not produce more spend than cap (since capped)
    expect(spendingPerTick(aboveCap)).toBe(spendingPerTick(atCap));

    // And spend should be at least base + max fear bonus (plus happiness bonus if any)
    expect(spendingPerTick(atCap)).toBeGreaterThanOrEqual(
      BASE_SPEND_PER_TICK + MAX_FEAR_BONUS_PER_TICK,
    );
  });

  it('maximum happiness produces at most MAX_HAPPY_BONUS_PER_TICK bonus (not unbounded)', () => {
    // pick fear that yields no panic and ideally no fear bonus complications
    const fear = 0;

    const justAtBoostStart = makeVisitor({ happiness: HAPPY_SPEND_BOOST_START, fear });
    const maxHappy = makeVisitor({ happiness: 100, fear });

    // maxHappy >= atBoostStart is already covered; here we sanity check it doesn't explode.
    // Since bonuses are floored/lerped, maxHappy should be within a reasonable upper bound:
    const maxPossible = BASE_SPEND_PER_TICK + MAX_HAPPY_BONUS_PER_TICK + MAX_FEAR_BONUS_PER_TICK;
    expect(spendingPerTick(maxHappy)).toBeLessThanOrEqual(maxPossible);

    // and it should be >= base spend when not stopped
    expect(spendingPerTick(justAtBoostStart)).toBeGreaterThanOrEqual(BASE_SPEND_PER_TICK);
  });
});

describe('totalSpendingPerTick', () => {
  it('sums spendingPerTick across visitors', () => {
    const v1 = makeVisitor({ id: 1, fear: 0, happiness: 100 });
    const v2 = makeVisitor({ id: 2, fear: FEAR_PANIC_THRESHOLD, happiness: 100 }); // should spend 0
    const v3 = makeVisitor({ id: 3, fear: FEAR_SPEND_BOOST_CAP, happiness: 100 });

    const expected = spendingPerTick(v1) + spendingPerTick(v2) + spendingPerTick(v3);
    expect(totalSpendingPerTick([v1, v2, v3])).toBe(expected);
  });

  it('returns 0 for an empty list', () => {
    expect(totalSpendingPerTick([])).toBe(0);
  });
});
