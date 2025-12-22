import Phaser from 'phaser';

import { useGameStore } from '../../store/gameStore';

export const MAIN_SCENE_KEY = 'MainScene';

export default class MainScene extends Phaser.Scene {
  private dayText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private moneyText?: Phaser.GameObjects.Text;
  private visitorsText?: Phaser.GameObjects.Text;

  constructor() {
    super(MAIN_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;
    const store = useGameStore.getState();

    this.timeText = this.add.text(width /2, 100, 'Time: 0 ms', {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);

    this.dayText = this.add.text(width /2, 50, `Day: ${store.day}`, {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);

    this.visitorsText = this.add.text(width /2, 150, `Visitors: ${store.visitors}`, {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);

    this.moneyText = this.add.text(width /2, 200, `Money: $${store.money}`, {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, 'Haunted House Tycoon', {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    const store = useGameStore.getState();
    store.advanceTime(delta);

    this.timeText?.setText(`Time: ${store.totalTime.toFixed(0)} ms`);
    this.dayText?.setText(`Day: ${store.day}`);
    this.visitorsText?.setText(`Visitors: ${store.visitors}`);
    this.moneyText?.setText(`Money: $${store.money}`);
  }
}
