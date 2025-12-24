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

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const spendingPerTick = (v: Visitor): number => {
  // hard stops
  if (v.happiness <= UNHAPPY_SPEND_STOP) return 0;
  if (v.fear >= FEAR_PANIC_THRESHOLD) return 0;

  // fear bonus ramps up until FEAR_SPEND_BOOST_CAP
  const fearT = clamp01(
    (v.fear - FEAR_SPEND_BOOST_START) / (FEAR_SPEND_BOOST_CAP - FEAR_SPEND_BOOST_START),
  );
  const fearBonus = Math.floor(lerp(0, MAX_FEAR_BONUS_PER_TICK, fearT));

  // happiness bonus ramps up above HAPPY_SPEND_BOOST_START
  const happyT = clamp01((v.happiness - HAPPY_SPEND_BOOST_START) / (100 - HAPPY_SPEND_BOOST_START));
  const happyBonus = Math.floor(lerp(0, MAX_HAPPY_BONUS_PER_TICK, happyT));

  return BASE_SPEND_PER_TICK + fearBonus + happyBonus;
};

export const totalSpendingPerTick = (visitors: Visitor[]): number =>
  visitors.reduce((sum, v) => sum + spendingPerTick(v), 0);
