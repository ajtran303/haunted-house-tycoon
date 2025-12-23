import type { Cell, Grid } from '../../../core/types';

const CELL_SIZE = 24;
const ORIGIN_X = 20;
const ORIGIN_Y = 60;

type GridRenderer = {
  draw: (grid: Grid) => void;
  destroy: () => void;
  setEnabled: (enabled: boolean) => void;
};

const COLOR_EMPTY = 0x222222;
const COLOR_ENTRY = 0x2ecc71;
const COLOR_HALLWAY = 0x95a5a6;
const COLOR_SCARE = 0x9b59b6;
const COLOR_PARK_ENTRY = 0x0000ff;
const COLOR_PARK_EXIT = 0xe74c3c;

const fillForCell = (cell: Cell) => {
  if (!cell.occupied) return COLOR_EMPTY;

  switch (cell.roomType) {
    case 'entry':
      return COLOR_ENTRY;
    case 'hallway':
      return COLOR_HALLWAY;
    case 'scare':
      return COLOR_SCARE;
    case 'parkEntry':
      return COLOR_PARK_ENTRY;
    case 'parkExit':
      return COLOR_PARK_EXIT;
    default:
      // fallback if older saves/tests don’t set roomType yet
      return 0x666666;
  }
};

export const createGridRenderer = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scene: any,
  grid: Grid,
  onCellClick: (x: number, y: number) => void,
): GridRenderer => {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rects: any[][] = [];

  for (let y = 0; y < height; y++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any[] = [];
    for (let x = 0; x < width; x++) {
      const r = scene.add.rectangle(
        ORIGIN_X + x * CELL_SIZE,
        ORIGIN_Y + y * CELL_SIZE,
        CELL_SIZE - 1,
        CELL_SIZE - 1,
        0x222222,
      );
      r.setOrigin(0, 0);

      // ✅ make each cell clickable
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => onCellClick(x, y));

      row.push(r);
    }
    rects.push(row);
  }

  const draw = (next: Grid) => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = next[y][x];
        rects[y][x].setFillStyle(fillForCell(cell));
      }
    }
  };

  const setEnabled = (enabled: boolean) => {
    // disable clicks when paused (and also disable hand cursor)
    for (const row of rects) {
      for (const r of row) {
        if (r.input) r.input.enabled = enabled;
      }
    }
  };

  draw(grid);

  const destroy = () => {
    for (const row of rects) for (const r of row) r.destroy();
  };

  return { draw, destroy, setEnabled };
};
