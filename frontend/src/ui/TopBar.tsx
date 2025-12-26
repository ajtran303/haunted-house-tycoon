import { useMemo } from 'react';

import { getTimeOfDay } from '../core/timeOfDay';
import { useGameStore } from '../runtime/store';

export const TopBar = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const day = useGameStore((s) => s.day);
  const tick = useGameStore((s) => s.tick);
  const money = useGameStore((s) => s.money);
  const visitors = useGameStore((s) => s.visitors);

  const timeOfDay = getTimeOfDay(tick);

  // Compute averages from visitors array - memoized to avoid recomputing unless visitors change
  const { visitorCount, avgHappiness, avgFear } = useMemo(() => {
    const count = visitors.length;
    if (count === 0) {
      return { visitorCount: 0, avgHappiness: 0, avgFear: 0 };
    }

    let sumHappy = 0;
    let sumFear = 0;
    for (const v of visitors) {
      sumHappy += v.happiness;
      sumFear += v.fear;
    }

    return {
      visitorCount: count,
      avgHappiness: Math.round(sumHappy / count),
      avgFear: Math.round(sumFear / count),
    };
  }, [visitors]);

  if (lifecycle !== 'running' && lifecycle !== 'paused') {
    return null;
  }

  return (
    <div className="fixed top-0 right-64 left-0 z-50 flex flex-col gap-1 bg-gray-900 px-4 py-2 font-mono text-sm text-white">
      <div className="flex items-center gap-6">
        <Stat label="MONEY" value={`$${money}`} />
        <Stat label="DAY" value={day} />
        <Stat label="TIME" value={timeOfDay} />
        <Stat label="VISITORS" value={visitorCount} />
      </div>
      <div className="flex items-center gap-6">
        <StatBar label="HAPPINESS" value={avgHappiness} color="green" />
        <StatBar label="FEAR" value={avgFear} color="red" />
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-400">{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

const StatBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'green' | 'red';
}) => {
  const barColor = color === 'green' ? 'bg-green-500' : 'bg-red-500';
  const bgColor = color === 'green' ? 'bg-green-900' : 'bg-red-900';

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{label}</span>
      <div className={`h-3 w-20 rounded ${bgColor}`}>
        <div
          className={`h-full rounded ${barColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="w-8 text-right font-bold">{value.toFixed(0)}</span>
    </div>
  );
};
