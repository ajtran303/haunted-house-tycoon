/* eslint-disable @typescript-eslint/no-explicit-any */

import { getRoomCells } from '../../../core/placement';
import type { Cell, Grid, RoomType } from '../../../core/types';
import { upkeepPerTick } from '../../../core/economy';
import { useGameStore } from '../../../runtime/store';
import { getCellSizeForHeight, getCurrentOriginX, GRID_ORIGIN_Y } from '../gridSizing';

// Format room type for display (e.g., 'parkEntry' -> 'Park Entry')
const formatRoomType = (roomType: RoomType): string => {
  const labels: Record<RoomType, string> = {
    entry: 'Entry',
    exit: 'Exit',
    hallway: 'Hallway',
    scare: 'Scare',
    parkEntry: 'Park Entry',
    parkExit: 'Park Exit',
    attractionPortal: 'Portal',
    foodStall: 'Food Stall',
    giftShop: 'Gift Shop',
    restroom: 'Restroom',
    photoBooth: 'Photo Booth',
    arcade: 'Arcade',
    firstAid: 'First Aid',
  };
  return labels[roomType] ?? roomType;
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

type GridRenderer = {
  draw: (grid: Grid) => void;
  destroy: () => void;
  setEnabled: (enabled: boolean) => void;
};

// Colorblind-friendly palette (Wong palette + adjustments)
// Avoids red/green confusion, uses distinct hues
const COLOR_EMPTY = 0x333333; // Dark gray
const COLOR_ENTRY = 0x009e73; // Bluish green (attraction entry)
const COLOR_EXIT = 0xcc79a7; // Reddish purple (attraction exit)
const COLOR_HALLWAY = 0x999999; // Medium gray
const COLOR_SCARE = 0xe69f00; // Orange (high visibility)
const COLOR_PARK_ENTRY = 0x56b4e9; // Sky blue (park entry)
const COLOR_PARK_EXIT = 0xd55e00; // Vermillion/burnt orange (park exit)
const COLOR_PORTAL = 0xf0e442; // Yellow (portals - high contrast)

// Amenity colors (warm/inviting tones, colorblind-safe)
const COLOR_FOOD_STALL = 0xf5deb3; // Wheat/tan (food)
const COLOR_GIFT_SHOP = 0xdda0dd; // Plum (shopping) - reserved
const COLOR_RESTROOM = 0x87ceeb; // Light sky blue (facilities) - reserved
const COLOR_PHOTO_BOOTH = 0xdeb887; // Burlywood (vintage) - reserved
const COLOR_ARCADE = 0xb19cd9; // Light purple (games) - reserved
const COLOR_FIRST_AID = 0xf0f0f0; // Off-white (medical) - reserved

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
    case 'foodStall':
      return COLOR_FOOD_STALL;
    case 'giftShop':
      return COLOR_GIFT_SHOP;
    case 'restroom':
      return COLOR_RESTROOM;
    case 'photoBooth':
      return COLOR_PHOTO_BOOTH;
    case 'arcade':
      return COLOR_ARCADE;
    case 'firstAid':
      return COLOR_FIRST_AID;
    default:
      // fallback if older saves/tests don't set roomType yet
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
  const CELL_SIZE = getCellSizeForHeight(height);
  const ORIGIN_X = getCurrentOriginX();
  const ORIGIN_Y = GRID_ORIGIN_Y;

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

  // Portal highlight (2x2 clickable hint)
  const portalHighlight = scene.add.graphics();
  portalHighlight.setDepth(6);

  const drawPortalHighlight = (cellX: number, cellY: number) => {
    portalHighlight.clear();
    // Draw glowing outline for 2x2 portal area
    portalHighlight.lineStyle(3, 0xf0e442, 0.9); // Yellow to match portal color
    const px = ORIGIN_X + cellX * CELL_SIZE;
    const py = ORIGIN_Y + cellY * CELL_SIZE;
    // Portal is 2x2
    portalHighlight.strokeRect(px, py, CELL_SIZE * 2 - 1, CELL_SIZE * 2 - 1);
  };

  const hidePortalHighlight = () => {
    portalHighlight.clear();
  };

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

  // Placement preview (shows where room will be placed)
  const placementPreview = scene.add.graphics();
  placementPreview.setDepth(5);

  const drawPlacementPreview = (cellX: number, cellY: number) => {
    placementPreview.clear();

    const selectedRoomType = useGameStore.getState().selectedRoomType;
    if (!selectedRoomType) return;

    const cells = getRoomCells(selectedRoomType);

    // Check if any cell would be out of bounds
    const isOutOfBounds = cells.some((c) => {
      const cx = cellX + c.x;
      const cy = cellY + c.y;
      return cx < 0 || cx >= width || cy < 0 || cy >= height;
    });

    // Using colorblind-friendly colors: blue for valid, orange for invalid
    if (isOutOfBounds) {
      placementPreview.lineStyle(2, 0xd55e00, 0.9);
    } else {
      placementPreview.lineStyle(2, 0x56b4e9, 0.9);
    }

    // Draw each cell of the shape
    for (const c of cells) {
      const px = ORIGIN_X + (cellX + c.x) * CELL_SIZE;
      const py = ORIGIN_Y + (cellY + c.y) * CELL_SIZE;
      placementPreview.strokeRect(px, py, CELL_SIZE - 1, CELL_SIZE - 1);
    }
  };

  const hidePlacementPreview = () => {
    placementPreview.clear();
  };

  const formatHoverInfo = (cell: Cell) => {
    if (!cell.occupied || !cell.roomType) return '';

    const state = useGameStore.getState();
    const selectedRoomType = state.selectedRoomType;

    // Portal: show attraction name + upkeep + click hint
    if (cell.roomType === 'attractionPortal' && cell.portalTo) {
      const attraction = state.attractions[cell.portalTo];
      if (attraction) {
        const upkeep = upkeepPerTick(attraction.grid);
        const clickHint = !selectedRoomType ? '\n[click to enter]' : '';
        return `${attraction.name}\nUpkeep: $${upkeep}/tick${clickHint}`;
      }
    }

    // All other rooms: just show the formatted type
    return formatRoomType(cell.roomType);
  };

  const positionTooltip = (pointer: any) => {
    // Pointer coords are in screen space; with no camera movement these map to world.
    // If you later add camera scrolling/zoom, swap to pointer.worldX/worldY.
    const offsetX = 14;
    const offsetY = 8; // Gap above cursor

    // getBounds is safe after setText (Phaser recalculates size lazily)
    const b = infoText.getBounds();

    // Position above the cursor
    const rawX = pointer.x + offsetX;
    const rawY = pointer.y - b.height - offsetY;

    // Clamp to viewport so text doesn't go off-screen.
    const viewW = scene.scale?.width ?? scene.sys.game.config.width;
    const viewH = scene.scale?.height ?? scene.sys.game.config.height;

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
        // Always show placement preview when a room is selected
        drawPlacementPreview(x, y);

        // Show info tooltip only for occupied cells
        const cell = currentGrid[y]?.[x];
        if (!cell || !cell.occupied) return;

        highlight.setPosition(ORIGIN_X + x * CELL_SIZE, ORIGIN_Y + y * CELL_SIZE).setVisible(true);

        // Show portal highlight when hovering over a portal (and no room selected)
        const selectedRoomType = useGameStore.getState().selectedRoomType;
        if (cell.roomType === 'attractionPortal' && cell.portalTo && !selectedRoomType) {
          // Find top-left of the 2x2 portal by checking if adjacent cells share the roomId
          let originX = x;
          let originY = y;
          const leftCell = currentGrid[y]?.[x - 1];
          if (leftCell?.roomId === cell.roomId) originX = x - 1;
          const topCell = currentGrid[y - 1]?.[x];
          if (topCell?.roomId === cell.roomId) originY = y - 1;
          drawPortalHighlight(originX, originY);
        }

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
        hidePlacementPreview();
        hidePortalHighlight();
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
    placementPreview.destroy();
    portalHighlight.destroy();
    for (const row of rects) for (const r of row) r.destroy();
  };

  return { draw, destroy, setEnabled };
};
