// src/ui/hud/selectors.ts
import type { GameState } from '../../core/types';

export type HudSnapshot = {
  money: number;
  visitorCount: number;
  avgHappiness: number; // 0..100
  avgFear: number; // 0..100
};

export type CriticalFlag =
  | 'money_low'
  | 'fear_high'
  | 'exiting_rapidly' // real park exits
  | 'bankruptcy_imminent'
  | 'deaths_spiking';

export type CriticalSnapshot = {
  flags: Set<CriticalFlag>;
  exitsInWindow: number;
  deathsInWindow: number;
  panicInWindow: number;
  miseryInWindow: number;
};

const clamp0to100 = (n: number) => Math.max(0, Math.min(100, n));

export const selectHudSnapshot = (st: GameState): HudSnapshot => {
  const count = st.visitors.length;

  let sumHappy = 0;
  let sumFear = 0;

  for (const v of st.visitors) {
    sumHappy += v.happiness;
    sumFear += v.fear;
  }

  const avgHappiness = count ? sumHappy / count : 0;
  const avgFear = count ? sumFear / count : 0;

  return {
    money: st.money,
    visitorCount: count,
    avgHappiness: clamp0to100(avgHappiness),
    avgFear: clamp0to100(avgFear),
  };
};

// Minimal thresholds (tune later)
const MONEY_LOW = 100;
const FEAR_HIGH = 70;

// Rolling windows measured purely in ticks (no TPS needed)
const WINDOW_TICKS = 60;
const EXIT_SPIKE_COUNT = 6; // park exits within window => warning
const DEATH_SPIKE_COUNT = 6; // panic/misery deaths within window => warning

export const selectCriticalSnapshot = (st: GameState): CriticalSnapshot => {
  const flags = new Set<CriticalFlag>();

  // Money: bankruptcy imminent is strict and should override “low”
  if (st.money <= 0) flags.add('bankruptcy_imminent');
  else if (st.money <= MONEY_LOW) flags.add('money_low');

  // Avg fear high
  const { avgFear } = selectHudSnapshot(st);
  if (avgFear >= FEAR_HIGH) flags.add('fear_high');

  // Park exits spiking (real navigation completions)
  const now = st.tick;
  let exitsInWindow = 0;

  for (let i = st.parkExitEvents.length - 1; i >= 0; i--) {
    const e = st.parkExitEvents[i]!;
    if (e.tick < now - WINDOW_TICKS) break;
    exitsInWindow++;
  }
  if (exitsInWindow >= EXIT_SPIKE_COUNT) flags.add('exiting_rapidly');

  // Deaths spiking
  let deathsInWindow = 0;
  let panicInWindow = 0;
  let miseryInWindow = 0;

  for (let i = st.exitEvents.length - 1; i >= 0; i--) {
    const e = st.exitEvents[i]!;
    if (e.tick < now - WINDOW_TICKS) break;

    deathsInWindow++;
    if (e.reason === 'panic') panicInWindow++;
    else if (e.reason === 'misery') miseryInWindow++;
  }
  if (deathsInWindow >= DEATH_SPIKE_COUNT) flags.add('deaths_spiking');

  return { flags, exitsInWindow, deathsInWindow, panicInWindow, miseryInWindow };
};
