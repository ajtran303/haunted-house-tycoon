import { useGameStore } from '../runtime/store';

export const PauseScreen = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);

  if (lifecycle !== 'paused') {
    return null;
  }

  const handleResume = () => {
    useGameStore.getState().resume();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-gray-950/80 pb-[110%]">
      <div className="text-center font-mono">
        <h1 className="mb-8 text-3xl font-bold text-orange-400">PAUSED</h1>

        <button
          onClick={handleResume}
          className="rounded bg-green-700 px-8 py-4 text-xl font-bold text-white transition-colors hover:bg-green-600"
        >
          Resume
        </button>
      </div>
    </div>
  );
};
