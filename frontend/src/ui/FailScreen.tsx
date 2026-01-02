import type { FailureCause } from '../core/types';
import { useGameStore } from '../runtime/store';

const CAUSE_LABELS: Record<FailureCause, string> = {
  bankruptcy: 'BANKRUPTCY',
  structural: 'PARK CLOSED - BLOCKED ACCESS',
  death_shutdown: 'PARK SHUT DOWN - TOO MANY DEATHS',
};

const CAUSE_DESCRIPTIONS: Record<FailureCause, string> = {
  bankruptcy: 'You ran out of money to keep the park running.',
  structural: 'The entrance or exit became blocked, trapping visitors.',
  death_shutdown: 'Health authorities shut down your park due to sustained visitor deaths.',
};

const StatItem = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) => (
  <div className="text-center">
    <div className="text-xs text-gray-500">{label}</div>
    <div className={`text-lg font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</div>
  </div>
);

export const FailScreen = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const failureSummary = useGameStore((s) => s.failureSummary);
  const newGame = useGameStore((s) => s.newGame);

  if (lifecycle !== 'failed' || !failureSummary) {
    return null;
  }

  const summary = failureSummary;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="mx-4 w-full max-w-md rounded-lg border border-red-800 bg-gray-900 p-6 font-mono text-white shadow-2xl">
        {/* Header */}
        <div className="mb-4 text-center">
          <div className="text-2xl font-bold text-red-500">GAME OVER</div>
          <div className="mt-2 text-lg text-orange-400">{CAUSE_LABELS[summary.cause]}</div>
          <div className="mt-2 text-sm text-gray-400">{CAUSE_DESCRIPTIONS[summary.cause]}</div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
          <StatItem label="Days Survived" value={summary.daysFailed} />
          <StatItem label="Final Money" value={`$${summary.finalMoney}`} />
          <StatItem label="Lifetime Visitors" value={summary.lifetimeVisitors} />
          <StatItem label="At Failure" value={summary.activeVisitorsAtFail} />
        </div>

        {/* Deaths breakdown (if any) */}
        {summary.totalDeaths > 0 && (
          <div className="mb-6 border-t border-gray-700 pt-4">
            <div className="mb-2 text-sm font-bold text-gray-400">DEATHS</div>
            <div className="grid grid-cols-3 gap-4">
              <StatItem label="Total" value={summary.totalDeaths} highlight />
              <StatItem label="Panic" value={summary.panicDeaths} />
              <StatItem label="Misery" value={summary.miseryDeaths} />
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="mb-6 border-t border-gray-700 pt-4">
          <div className="mb-2 text-sm font-bold text-gray-400">LAST DAY</div>
          <div className="grid grid-cols-2 gap-4">
            <StatItem label="Exits" value={summary.recentParkExits} />
            <StatItem label="Deaths" value={summary.recentDeaths} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-gray-700 pt-4">
          <button
            onClick={newGame}
            className="w-full rounded bg-green-700 px-4 py-3 font-bold text-white transition-colors hover:bg-green-600"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};
