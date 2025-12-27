import { useMemo } from 'react';

import { getTimeOfDay } from '../core/timeOfDay';
import { DEV_MODE } from '../dev/devMode';
import { computeDeathStats, computeVisitorStats } from '../runtime/selectors';
import { useGameStore } from '../runtime/store';

export const TopBar = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const day = useGameStore((s) => s.day);
  const tick = useGameStore((s) => s.tick);
  const money = useGameStore((s) => s.money);
  const currentView = useGameStore((s) => s.currentView);
  const attractions = useGameStore((s) => s.attractions);
  const visitors = useGameStore((s) => s.visitors);
  const exitEvents = useGameStore((s) => s.exitEvents);

  const { visitorCount, avgHappiness, avgFear, scaredCount } = useMemo(
    () => computeVisitorStats(visitors),
    [visitors],
  );

  const { panicCount, miseryCount, totalDeaths } = useMemo(
    () => computeDeathStats(exitEvents),
    [exitEvents],
  );

  const timeOfDay = getTimeOfDay(tick).toUpperCase();

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
      className={`fixed top-0 right-96 left-0 z-50 flex flex-col gap-2 px-6 py-3 font-mono text-base text-white ${bgColor} ${borderColor}`}
    >
      <div className="text-2xl font-bold">{viewName}</div>
      <div className="flex items-center gap-8">
        <Stat label="MONEY" value={`$${money}`} />
        <Stat label="DAY" value={day} />
        <Stat label="TIME" value={timeOfDay} />
        <Stat label="VISITORS" value={visitorCount} />
      </div>
      <div className="flex items-center gap-8">
        <StatBar label="HAPPINESS" value={avgHappiness} color="happiness" />
        <StatBar
          label="FEAR"
          value={avgFear}
          color="fear"
          suffix={DEV_MODE ? `(${scaredCount})` : undefined}
        />
      </div>
      {totalDeaths > 0 && (
        <div className="flex items-center gap-8">
          <span className="text-red-400">DEATHS</span>
          {miseryCount > 0 && <Stat label="MISERY" value={miseryCount} />}
          {panicCount > 0 && <Stat label="PANIC" value={panicCount} />}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center gap-3">
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
  suffix,
}: {
  label: string;
  value: number;
  color: 'happiness' | 'fear';
  suffix?: string;
}) => {
  // Happiness: sky blue (calm/positive), Fear: orange (warning/danger)
  const barColor = color === 'happiness' ? 'bg-sky-400' : 'bg-orange-500';
  const bgColor = color === 'happiness' ? 'bg-sky-900' : 'bg-orange-900';

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400">{label}</span>
      <div className={`h-4 w-36 rounded ${bgColor}`}>
        <div
          className={`h-full rounded ${barColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
    </div>
  );
};
