import { useMemo } from 'react';

import { getTimeOfDay } from '../core/timeOfDay';
import { useGameStore } from '../runtime/store';

export const TopBar = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const day = useGameStore((s) => s.day);
  const tick = useGameStore((s) => s.tick);
  const money = useGameStore((s) => s.money);
  const visitors = useGameStore((s) => s.visitors);
  const currentView = useGameStore((s) => s.currentView);
  const attractions = useGameStore((s) => s.attractions);

  const timeOfDay = getTimeOfDay(tick).toUpperCase();

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

  const isAttraction = currentView.type === 'attraction';
  const viewName =
    currentView.type === 'midway'
      ? 'Midway'
      : (attractions[currentView.attractionId]?.name ?? 'Unknown');

  // Attraction view gets a distinct tint (purple-ish) to reinforce "inside attraction"
  const bgColor = isAttraction ? 'bg-purple-950' : 'bg-gray-900';
  const borderColor = isAttraction ? 'border-b-2 border-purple-500' : '';

  return (
    <div
      className={`fixed top-0 right-64 left-0 z-50 flex flex-col gap-1 px-4 py-2 font-mono text-sm text-white ${bgColor} ${borderColor}`}
    >
      <div className="text-lg font-bold">{viewName}</div>
      <div className="flex items-center gap-6">
        <Stat label="MONEY" value={`$${money}`} />
        <Stat label="DAY" value={day} />
        <Stat label="TIME" value={timeOfDay} />
        <Stat label="VISITORS" value={visitorCount} />
      </div>
      <div className="flex items-center gap-6">
        <StatBar label="HAPPINESS" value={avgHappiness} color="happiness" />
        <StatBar label="FEAR" value={avgFear} color="fear" />
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

// Colorblind-friendly stat bar colors
// Uses blue/orange instead of green/red for accessibility
const StatBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'happiness' | 'fear';
}) => {
  // Happiness: sky blue (calm/positive), Fear: orange (warning/danger)
  const barColor = color === 'happiness' ? 'bg-sky-400' : 'bg-orange-500';
  const bgColor = color === 'happiness' ? 'bg-sky-900' : 'bg-orange-900';

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{label}</span>
      <div className={`h-3 w-24 rounded ${bgColor}`}>
        <div
          className={`h-full rounded ${barColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
};
