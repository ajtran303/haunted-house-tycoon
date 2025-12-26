/* eslint-disable @typescript-eslint/no-explicit-any */

import { ROOM_COST } from '../../../core/constants';
import type { Cell, Grid } from '../../../core/types';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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
const COLOR_EXIT = 0xf417e3;
const COLOR_HALLWAY = 0x95a5a6;
const COLOR_SCARE = 0x9b59b6;
const COLOR_PARK_ENTRY = 0x0000ff;
const COLOR_PARK_EXIT = 0xe74c3c;
const COLOR_PORTAL = 0xff8800; // Orange for portals

const fillForCell = (cell: Cell) => {
  if (!cell.occupied) return COLOR_EMPTY;

  switch (cell.roomType) {
    case 'entry':
      return COLOR_ENTRY;
    case 'exit':
      return COLOR_EXIT;
    case 'hallway':
      return COLOR_HALLWAY;
    case 'scare':
      return COLOR_SCARE;
    case 'parkEntry':
      return COLOR_PARK_ENTRY;
    case 'parkExit':
      return COLOR_PARK_EXIT;
    case 'attractionPortal':
      return COLOR_PORTAL;
    default:
      // fallback if older saves/tests don’t set roomType yet
      return 0x666666;
  }
};

export const createGridRenderer = (
  scene: any,
  grid: Grid,
  onCellClick: (x: number, y: number) => void,
): GridRenderer => {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Renderer-local only (no store mutations)
  let clicksEnabled = true;
  let currentGrid: Grid = grid;

  const rects: any[][] = [];

  // Hover highlight (outline)
  const highlight = scene.add
    .rectangle(ORIGIN_X, ORIGIN_Y, CELL_SIZE - 1, CELL_SIZE - 1)
    .setOrigin(0, 0)
    .setFillStyle(0x000000, 0)
    .setStrokeStyle(2, 0xffffff, 1)
    .setVisible(false);

  // Hover tooltip (temporary overlay; follow mouse)
  const infoText = scene.add
    .text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 6, y: 4 },
    })
    .setDepth(10)
    .setVisible(false);

  const formatHoverInfo = (cell: Cell) => {
    const roomType = cell.occupied ? (cell.roomType ?? 'unknown') : 'empty';
    const roomId = cell.occupied ? (cell.roomId ?? '—') : '—';
    const cost = cell.occupied && cell.roomType ? ROOM_COST[cell.roomType] : undefined;
    const costStr = cost === undefined ? '—' : String(cost);
    const portalInfo = cell.portalTo ? `\nportal→ ${cell.portalTo}` : '';
    return `type: ${roomType}\ncost: ${costStr}\nid: ${roomId}${portalInfo}`;
  };

  const positionTooltip = (pointer: any) => {
    // Pointer coords are in screen space; with no camera movement these map to world.
    // If you later add camera scrolling/zoom, swap to pointer.worldX/worldY.
    const offsetX = 14;
    const offsetY = 18;

    const rawX = pointer.x + offsetX;
    const rawY = pointer.y + offsetY;

    // Clamp to viewport so text doesn't go off-screen.
    const viewW = scene.scale?.width ?? scene.sys.game.config.width;
    const viewH = scene.scale?.height ?? scene.sys.game.config.height;

    // getBounds is safe after setText (Phaser recalculates size lazily)
    const b = infoText.getBounds();
    const x = clamp(rawX, 4, Math.max(4, viewW - b.width - 4));
    const y = clamp(rawY, 4, Math.max(4, viewH - b.height - 4));

    infoText.setPosition(x, y);
  };

  for (let y = 0; y < height; y++) {
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

      // Keep input enabled so hover feedback always works.
      // Gate only the click action via clicksEnabled.
      r.setInteractive({ useHandCursor: true });

      r.on('pointerdown', () => {
        if (!clicksEnabled) return;
        onCellClick(x, y);
      });

      r.on('pointerover', (pointer: any) => {
        const cell = currentGrid[y]?.[x];
        if (!cell || !cell.occupied) return;

        highlight.setPosition(ORIGIN_X + x * CELL_SIZE, ORIGIN_Y + y * CELL_SIZE).setVisible(true);

        infoText.setText(formatHoverInfo(cell)).setVisible(true);
        positionTooltip(pointer);
      });

      // Follow mouse while hovering this cell
      r.on('pointermove', (pointer: any) => {
        if (!infoText.visible) return;
        positionTooltip(pointer);
      });

      r.on('pointerout', () => {
        highlight.setVisible(false);
        infoText.setVisible(false);
      });

      row.push(r);
    }
    rects.push(row);
  }

  const draw = (next: Grid) => {
    currentGrid = next;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = next[y][x];
        rects[y][x].setFillStyle(fillForCell(cell));
      }
    }
  };

  const setEnabled = (enabled: boolean) => {
    // Disable placement clicks when paused, but keep hover feedback working.
    clicksEnabled = enabled;
  };

  draw(grid);

  const destroy = () => {
    highlight.destroy();
    infoText.destroy();
    for (const row of rects) for (const r of row) r.destroy();
  };

  return { draw, destroy, setEnabled };
};
