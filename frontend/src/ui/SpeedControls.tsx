import { useGameStore } from '../runtime/store';

export const SpeedControls = () => {
  const setSpeed1x = useGameStore((s) => s.setSpeed1x);
  const setSpeed4x = useGameStore((s) => s.setSpeed4x);
  const speed = useGameStore((s) => s.speed);

  const btn = (active: boolean) =>
    `mt-2 border px-2 py-1 ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`;

  return (
    <div className="top-2 right-2 border bg-white p-2 text-sm">
      <div className="mb-1 font-bold">Speed</div>

      <div className="flex gap-2">
        <button className={btn(speed === 1)} onClick={setSpeed1x}>
          1x
        </button>
        <button className={btn(speed === 4)} onClick={setSpeed4x}>
          4x
        </button>
      </div>

      <div className="mt-2">
        Selected: <span className="font-mono">{speed}</span>
      </div>
    </div>
  );
};
