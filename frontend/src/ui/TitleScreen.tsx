import { useGameStore } from '../runtime/store';

export const TitleScreen = () => {
  const lifecycle = useGameStore((s) => s.lifecycle);

  if (lifecycle !== 'title') {
    return null;
  }

  const handleStart = () => {
    useGameStore.setState({ lifecycle: 'paused' });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-950 pb-[110%]">
      <div className="text-center font-mono">
        <h1 className="mb-2 text-4xl font-bold text-orange-500">HAUNTED HOUSE</h1>
        <h2 className="mb-12 text-2xl text-orange-400">TYCOON</h2>

        <button
          onClick={handleStart}
          className="rounded bg-green-700 px-8 py-4 text-xl font-bold text-white transition-colors hover:bg-green-600"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};
