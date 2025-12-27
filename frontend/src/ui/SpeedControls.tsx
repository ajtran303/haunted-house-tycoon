import { DEV_MODE } from '../dev/devMode';
import { useGameStore } from '../runtime/store';

export const SpeedControls = () => {
  const setSpeed1x = useGameStore((s) => s.setSpeed1x);
  const setSpeed4x = useGameStore((s) => s.setSpeed4x);
  const setSpeed10x = useGameStore((s) => s.setSpeed10x);
  const speed = useGameStore((s) => s.speed);

  const btn = (active: boolean) =>
    `mt-3 border px-3 py-2 ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`;

  return (
    <div className="top-3 right-3 border bg-white p-3 text-base">
      <div className="mb-2 font-bold">Speed</div>

      <div className="flex gap-3">
        <button className={btn(speed === 1)} onClick={setSpeed1x}>
          1x
        </button>
        <button className={btn(speed === 4)} onClick={setSpeed4x}>
          4x
        </button>
        {DEV_MODE && (
          <button className={btn(speed === 10)} onClick={setSpeed10x}>
            10x
          </button>
        )}
      </div>

      <div className="mt-3">
        Selected: <span className="font-mono">{speed}</span>
      </div>
    </div>
  );
};
