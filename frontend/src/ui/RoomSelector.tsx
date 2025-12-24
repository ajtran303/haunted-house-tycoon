import { useGameStore } from '../runtime/store';

export const RoomSelector = () => {
  const selected = useGameStore((s) => s.selectedRoomType);
  const dispatch = useGameStore((s) => s.dispatchInput);

  const btn = (active: boolean) =>
    `mt-2 border px-2 py-1 ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`;

  return (
    <div className="top-2 right-2 border bg-white p-2 text-sm">
      <div className="mb-1 font-bold">Build</div>

      <div className="flex gap-2">
        <button
          className={btn(selected === 'parkEntry')}
          onClick={() => dispatch({ type: 'selectRoomType', roomType: 'parkEntry' })}
        >
          Park Entry
        </button>
        <button
          className={btn(selected === 'parkExit')}
          onClick={() => dispatch({ type: 'selectRoomType', roomType: 'parkExit' })}
        >
          Park Exit
        </button>
      </div>
      <div className="flex gap-2">
        <button
          className={btn(selected === 'entry')}
          onClick={() => dispatch({ type: 'selectRoomType', roomType: 'entry' })}
        >
          Entry
        </button>
        <button
          className={btn(selected === 'exit')}
          onClick={() => dispatch({ type: 'selectRoomType', roomType: 'exit' })}
        >
          Exit
        </button>
      </div>
      <div className="flex gap-2">
        <button
          className={btn(selected === 'hallway')}
          onClick={() => dispatch({ type: 'selectRoomType', roomType: 'hallway' })}
        >
          Hallway
        </button>
        <button
          className={btn(selected === 'scare')}
          onClick={() => dispatch({ type: 'selectRoomType', roomType: 'scare' })}
        >
          Scare
        </button>
      </div>

      <div className="mt-2">
        Selected: <span className="font-mono">{selected}</span>
      </div>
    </div>
  );
};
