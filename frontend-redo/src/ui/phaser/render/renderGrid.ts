import { useGameStore } from '../../../runtime/store';

const CELL_SIZE = 32;
const CELL_GAP = 2;
const ORIGIN_X = 20;
const ORIGIN_Y = 60;

export const renderGrid = (scene: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = scene as any;

  const { grid } = useGameStore.getState();

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];

    for (let x = 0; x < row.length; x++) {
      const cell = row[x];

      const px = ORIGIN_X + x * (CELL_SIZE + CELL_GAP);
      const py = ORIGIN_Y + y * (CELL_SIZE + CELL_GAP);

      // Default floor color. (Change later based on cell.type / occupied)
      const fill = cell.occupied ? 0x777777 : 0x333333;

      s.add
        .rectangle(px, py, CELL_SIZE, CELL_SIZE, fill)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0xaaaaaa);
    }
  }
};
