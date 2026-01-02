import { useMemo, useState } from 'react';

import { useGameStore } from '../runtime/store';
import { totalUpkeepPerTick } from '../core/economy';
import {
  BANKRUPTCY_WARNING_RUNWAY_TICKS,
  MONEY_LOW_THRESHOLD,
} from '../core/constants';

type CriticalFlag =
  | 'money_low'
  | 'fear_high'
  | 'exiting_rapidly'
  | 'bankruptcy_imminent'
  | 'deaths_spiking';

type WarningConfig = {
  flag: CriticalFlag;
  label: string;
  getCount?: (data: CriticalData) => number | string;
  severity: 'critical' | 'warning';
};

type CriticalData = {
  flags: Set<CriticalFlag>;
  exitsInWindow: number;
  deathsInWindow: number;
  runwayTicks: number;
};

const FEAR_HIGH = 70;
const WINDOW_TICKS = 60;
const EXIT_SPIKE_COUNT = 6;
const DEATH_SPIKE_COUNT = 6;

const WARNING_CONFIG: WarningConfig[] = [
  {
    flag: 'bankruptcy_imminent',
    label: 'BANKRUPTCY IMMINENT',
    getCount: (d) => (d.runwayTicks > 0 ? `${d.runwayTicks} ticks` : 'NOW'),
    severity: 'critical',
  },
  { flag: 'money_low', label: 'MONEY LOW', severity: 'warning' },
  { flag: 'fear_high', label: 'FEAR HIGH', severity: 'warning' },
  {
    flag: 'exiting_rapidly',
    label: 'EXITS SPIKING',
    getCount: (d) => d.exitsInWindow,
    severity: 'warning',
  },
  {
    flag: 'deaths_spiking',
    label: 'DEATHS SPIKING',
    getCount: (d) => d.deathsInWindow,
    severity: 'critical',
  },
];

// Position warnings well below the game canvas
const WARNINGS_TOP = 785;

export const Warnings = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const money = useGameStore((s) => s.money);
  const tick = useGameStore((s) => s.tick);
  const visitors = useGameStore((s) => s.visitors);
  const exitEvents = useGameStore((s) => s.exitEvents);
  const parkExitEvents = useGameStore((s) => s.parkExitEvents);
  const midwayGrid = useGameStore((s) => s.midwayGrid);
  const attractions = useGameStore((s) => s.attractions);
  const staffHired = useGameStore((s) => s.staffHired);
  const [dismissed, setDismissed] = useState<Set<CriticalFlag>>(new Set());

  const topPosition = WARNINGS_TOP;

  // Compute critical data from raw state
  const criticalData = useMemo((): CriticalData => {
    const flags = new Set<CriticalFlag>();

    // Calculate upkeep and runway
    const upkeep = totalUpkeepPerTick({ midwayGrid, attractions, staffHired } as Parameters<typeof totalUpkeepPerTick>[0]);
    const runwayTicks = upkeep > 0 ? Math.floor(money / upkeep) : Infinity;

    // Money warnings: bankruptcy based on runway, not just current balance
    if (money <= 0 || runwayTicks <= 0) {
      flags.add('bankruptcy_imminent');
    } else if (runwayTicks < BANKRUPTCY_WARNING_RUNWAY_TICKS) {
      flags.add('bankruptcy_imminent');
    } else if (money <= MONEY_LOW_THRESHOLD) {
      flags.add('money_low');
    }

    // Avg fear high
    if (visitors.length > 0) {
      let sumFear = 0;
      for (const v of visitors) sumFear += v.fear;
      const avgFear = sumFear / visitors.length;
      if (avgFear >= FEAR_HIGH) flags.add('fear_high');
    }

    // Park exits spiking
    let exitsInWindow = 0;
    for (let i = parkExitEvents.length - 1; i >= 0; i--) {
      const e = parkExitEvents[i]!;
      if (e.tick < tick - WINDOW_TICKS) break;
      exitsInWindow++;
    }
    if (exitsInWindow >= EXIT_SPIKE_COUNT) flags.add('exiting_rapidly');

    // Deaths spiking
    let deathsInWindow = 0;
    for (let i = exitEvents.length - 1; i >= 0; i--) {
      const e = exitEvents[i]!;
      if (e.tick < tick - WINDOW_TICKS) break;
      deathsInWindow++;
    }
    if (deathsInWindow >= DEATH_SPIKE_COUNT) flags.add('deaths_spiking');

    return { flags, exitsInWindow, deathsInWindow, runwayTicks: runwayTicks === Infinity ? 0 : runwayTicks };
  }, [money, tick, visitors, exitEvents, parkExitEvents, midwayGrid, attractions, staffHired]);

  if (lifecycle !== 'running') {
    return null;
  }

  // Filter: show warnings that are active AND not dismissed
  const activeWarnings = WARNING_CONFIG.filter((w) => {
    const isActive = criticalData.flags.has(w.flag);
    const isDismissed = dismissed.has(w.flag);
    return isActive && !isDismissed;
  });

  // Clean up stale dismissed flags
  const dismissedArray = Array.from(dismissed);
  const staleDismissed = dismissedArray.filter((flag) => !criticalData.flags.has(flag));
  if (staleDismissed.length > 0) {
    const newDismissed = new Set(dismissedArray.filter((flag) => criticalData.flags.has(flag)));
    if (newDismissed.size !== dismissed.size) {
      setTimeout(() => setDismissed(newDismissed), 0);
    }
  }

  if (activeWarnings.length === 0) {
    return null;
  }

  const handleDismiss = (flag: CriticalFlag) => {
    setDismissed((prev) => new Set(Array.from(prev).concat(flag)));
  };

  return (
    <div
      className="absolute right-0 left-0 z-40 flex flex-col gap-2 px-6"
      style={{ top: topPosition }}
    >
      {activeWarnings.map((warning) => {
        const count = warning.getCount?.(criticalData);
        const isCritical = warning.severity === 'critical';

        // Colorblind-friendly: orange for critical, sky blue for warning
        return (
          <button
            key={warning.flag}
            onClick={() => handleDismiss(warning.flag)}
            className={`flex items-center justify-between rounded px-4 py-2 font-mono text-base text-white transition-colors ${isCritical ? 'bg-orange-600 hover:bg-orange-700' : 'bg-sky-600 hover:bg-sky-700'}`}
          >
            <span>
              {warning.label}
              {count != null && ` (${count})`}
            </span>
            <span className="ml-6 text-sm opacity-75">click to dismiss</span>
          </button>
        );
      })}
    </div>
  );
};
