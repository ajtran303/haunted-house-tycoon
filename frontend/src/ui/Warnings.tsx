import { useMemo, useState } from 'react';

import { useGameStore } from '../runtime/store';

type CriticalFlag =
  | 'money_low'
  | 'fear_high'
  | 'exiting_rapidly'
  | 'bankruptcy_imminent'
  | 'deaths_spiking';

type WarningConfig = {
  flag: CriticalFlag;
  label: string;
  getCount?: (data: CriticalData) => number;
  severity: 'critical' | 'warning';
};

type CriticalData = {
  flags: Set<CriticalFlag>;
  exitsInWindow: number;
  deathsInWindow: number;
};

const MONEY_LOW = 100;
const FEAR_HIGH = 70;
const WINDOW_TICKS = 60;
const EXIT_SPIKE_COUNT = 6;
const DEATH_SPIKE_COUNT = 6;

const WARNING_CONFIG: WarningConfig[] = [
  { flag: 'bankruptcy_imminent', label: 'BANKRUPTCY IMMINENT', severity: 'critical' },
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

// Grid rendering constants (must match Phaser render files)
const GRID_ORIGIN_Y = 120;
const CELL_SIZE = 24;

export const Warnings = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const money = useGameStore((s) => s.money);
  const tick = useGameStore((s) => s.tick);
  const visitors = useGameStore((s) => s.visitors);
  const exitEvents = useGameStore((s) => s.exitEvents);
  const parkExitEvents = useGameStore((s) => s.parkExitEvents);
  const midwayGridHeight = useGameStore((s) => s.midwayGrid.length);
  const [dismissed, setDismissed] = useState<Set<CriticalFlag>>(new Set());

  // Calculate position below the grid
  const topPosition = GRID_ORIGIN_Y + midwayGridHeight * CELL_SIZE + 8;

  // Compute critical data from raw state
  const criticalData = useMemo((): CriticalData => {
    const flags = new Set<CriticalFlag>();

    // Money warnings
    if (money <= 0) flags.add('bankruptcy_imminent');
    else if (money <= MONEY_LOW) flags.add('money_low');

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

    return { flags, exitsInWindow, deathsInWindow };
  }, [money, tick, visitors, exitEvents, parkExitEvents]);

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
  const staleDismissed = [...dismissed].filter((flag) => !criticalData.flags.has(flag));
  if (staleDismissed.length > 0) {
    const newDismissed = new Set([...dismissed].filter((flag) => criticalData.flags.has(flag)));
    if (newDismissed.size !== dismissed.size) {
      setTimeout(() => setDismissed(newDismissed), 0);
    }
  }

  if (activeWarnings.length === 0) {
    return null;
  }

  const handleDismiss = (flag: CriticalFlag) => {
    setDismissed((prev) => new Set([...prev, flag]));
  };

  return (
    <div
      className="fixed right-64 left-0 z-40 flex flex-col gap-1 px-4"
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
            className={`flex items-center justify-between rounded px-3 py-1.5 font-mono text-sm text-white transition-colors ${isCritical ? 'bg-orange-600 hover:bg-orange-700' : 'bg-sky-600 hover:bg-sky-700'}`}
          >
            <span>
              {warning.label}
              {count != null && ` (${count})`}
            </span>
            <span className="ml-4 text-xs opacity-75">click to dismiss</span>
          </button>
        );
      })}
    </div>
  );
};
