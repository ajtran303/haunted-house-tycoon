import Phaser from 'phaser';

import type { Cell } from '../../domain/cell';
import { useGameStore } from '../../store/gameStore';

export const MAIN_SCENE_KEY = 'MainScene';

export default class MainScene extends Phaser.Scene {
  private dayText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private moneyText?: Phaser.GameObjects.Text;
  private visitorsText?: Phaser.GameObjects.Text;

  private gridGraphics?: Phaser.GameObjects.Graphics;

  private readonly cellSize = 24;
  private readonly offsetX = 40;
  private readonly offsetY = 260;

  constructor() {
    super(MAIN_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;
    const store = useGameStore.getState();

    this.timeText = this.add
      .text(width / 2, 100, 'Time: 0 ms', {
        color: '#ffffff',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.dayText = this.add
      .text(width / 2, 50, `Day: ${store.day}`, {
        color: '#ffffff',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.visitorsText = this.add
      .text(width / 2, 150, `Visitors: ${store.visitors}`, {
        color: '#ffffff',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.moneyText = this.add
      .text(width / 2, 200, `Money: $${store.money}`, {
        color: '#ffffff',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, 'Haunted House Tycoon', {
        color: '#ffffff',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 30, 'Grid Prototype', {
        color: '#ffffff',
        fontSize: '18px',
      })
      .setOrigin(0.5);

    this.gridGraphics = this.add.graphics();

    // temp demo cells (logical coords: bottom-left origin)
    store.setCellAt(2, 2, { type: 'floor', occupied: false, roomId: 'room-1' });
    store.setCellAt(3, 2, { type: 'floor', occupied: true, roomId: 'room-1' });
    store.setCellAt(4, 2, { type: 'wall', occupied: false, roomId: null });
    // remove above later

    // render once after initial setup
    this.renderGrid();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const pos = this.screenToLogicalCell(pointer.x, pointer.y);
      if (!pos) return;

      // hardcoded room type for now
      const result = useGameStore.getState().placeRoomAt(pos.x, pos.y, 'hallway');

      if (result.ok) {
        this.renderGrid(); // render after successful placement
      // } else {
        // optional: show a tiny message / flash the cell later
        // console.log('place failed:', result.reason);
      }
    });
  }

  update(_time: number, delta: number): void {
    const store = useGameStore.getState();

    store.advanceTime(delta);

    this.timeText?.setText(`Time: ${store.totalTime.toFixed(0)} ms`);
    this.dayText?.setText(`Day: ${store.day}`);
    this.visitorsText?.setText(`Visitors: ${store.visitors}`);
    this.moneyText?.setText(`Money: $${store.money}`);
  }

  private screenToLogicalCell(pointerX: number, pointerY: number): { x: number; y: number } | null {
    const store = useGameStore.getState();

    const localX = pointerX - this.offsetX;
    const localY = pointerY - this.offsetY;

    const x = Math.floor(localX / this.cellSize);
    const y = Math.floor(localY / this.cellSize);

    if (x < 0 || x >= store.gridWidth || y < 0 || y >= store.gridHeight) return null;
    return { x, y };
  }

  private renderGrid(): void {
    const store = useGameStore.getState();
    const g = this.gridGraphics;
    if (!g) return;

    const cellSize = 24;
    const offsetX = 40;
    const offsetY = 260;

    const gridWidth = store.gridWidth;
    const gridHeight = store.gridHeight;

    g.clear();

    // Render using logical coords where (0,0) is bottom-left.
    // Storage remains grid[row][col] (top-left), so flip y when reading:
    // row = (gridHeight - 1) - logicalY
    for (let logicalY = 0; logicalY < gridHeight; logicalY++) {
      const renderRow = (gridHeight - 1) - logicalY;

      for (let logicalX = 0; logicalX < gridWidth; logicalX++) {
        const cell = store.grid[renderRow][logicalX];

        const px = offsetX + logicalX * cellSize;
        const py = offsetY + logicalY * cellSize;

        g.lineStyle(1, 0xffffff, 0.35);
        g.fillStyle(this.colorForCell(cell), 0.9);

        g.fillRect(px, py, cellSize - 1, cellSize - 1);
        g.strokeRect(px, py, cellSize - 1, cellSize - 1);
      }
    }
  }

  private colorForCell(cell: Cell): number {
    if (cell.occupied) return 0xff66cc;

    switch (cell.type) {
      case 'wall':
        return 0x444444;
      case 'floor':
        return 0x999999;
      case 'empty':
      default:
        return 0x111111;
    }
  }
}
