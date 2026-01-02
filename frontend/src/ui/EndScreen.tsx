import { useGameStore } from '../runtime/store';

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
    <div className={`text-lg font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</div>
  </div>
);

const StarRating = ({ stars }: { stars: number }) => {
  const filled = '★'.repeat(stars);
  const empty = '☆'.repeat(5 - stars);
  return (
    <div className="text-4xl tracking-wider text-yellow-400">
      {filled}
      <span className="text-gray-600">{empty}</span>
    </div>
  );
};

const STAR_DESCRIPTIONS: Record<number, string> = {
  1: 'You survived... barely.',
  2: 'A profitable season!',
  3: 'Safe and successful!',
  4: 'Visitors left happy!',
  5: 'A legendary haunt master!',
};

export const EndScreen = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);
  const successSummary = useGameStore((s) => s.successSummary);
  const newGame = useGameStore((s) => s.newGame);

  if (lifecycle !== 'completed' || !successSummary) {
    return null;
  }

  const summary = successSummary;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="mx-4 w-full max-w-md rounded-lg border border-green-800 bg-gray-900 p-6 font-mono text-white shadow-2xl">
        {/* Header */}
        <div className="mb-4 text-center">
          <div className="text-2xl font-bold text-green-500">SEASON COMPLETE</div>
          <div className="mt-2 text-lg text-orange-400">Halloween - Day 31</div>
        </div>

        {/* Star Rating */}
        <div className="mb-4 text-center">
          <StarRating stars={summary.starRating} />
          <div className="mt-2 text-sm text-gray-400">
            {STAR_DESCRIPTIONS[summary.starRating] ?? ''}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
          <StatItem label="Final Money" value={`$${summary.finalMoney}`} highlight />
          <StatItem label="Total Revenue" value={`$${summary.totalRevenue}`} />
          <StatItem label="Visitors Served" value={summary.visitorsServed} />
          <StatItem label="Total Deaths" value={summary.totalDeaths} />
        </div>

        {/* Additional Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
          <StatItem label="Avg Exit Mood" value={`${summary.avgExitMood}%`} />
          <StatItem label="Attractions Built" value={summary.attractionsBuilt} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-gray-700 pt-4">
          <button
            onClick={newGame}
            className="w-full rounded bg-green-700 px-4 py-3 font-bold text-white transition-colors hover:bg-green-600"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
