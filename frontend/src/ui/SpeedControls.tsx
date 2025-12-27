import { DEV_MODE } from '../dev/devMode';
import { useGameStore } from '../runtime/store';

export const SpeedControls = () => {
  const setSpeed1x = useGameStore((s) => s.setSpeed1x);
  const setSpeed2x = useGameStore((s) => s.setSpeed2x);
  const setSpeed4x = useGameStore((s) => s.setSpeed4x);
  const setSpeed10x = useGameStore((s) => s.setSpeed10x);
  const speed = useGameStore((s) => s.speed);

  const btnBase = 'rounded border px-3 py-2';
  const btnInactive = `${btnBase} border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white`;
  const btnActive = `${btnBase} border-gray-500 bg-gray-700 text-white`;

  return (
    <div>
      <div className="mb-2 text-sm font-bold text-gray-400">SPEED</div>
      <div className="flex gap-2">
        <button className={speed === 1 ? btnActive : btnInactive} onClick={setSpeed1x}>
          1x
        </button>
        <button className={speed === 2 ? btnActive : btnInactive} onClick={setSpeed2x}>
          2x
        </button>
        <button className={speed === 4 ? btnActive : btnInactive} onClick={setSpeed4x}>
          4x
        </button>
        {DEV_MODE && (
          <button className={speed === 10 ? btnActive : btnInactive} onClick={setSpeed10x}>
            10x
          </button>
        )}
      </div>
    </div>
  );
};
