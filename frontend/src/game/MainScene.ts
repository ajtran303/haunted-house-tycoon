import Phaser from 'phaser';

export const MAIN_SCENE_KEY = 'MainScene';

export default class MainScene extends Phaser.Scene {
  private timeElapsed: number;
  private day: number;
  private tickAccumulator: number;

  private dayText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;


  constructor() {
    super(MAIN_SCENE_KEY);
    this.timeElapsed = 0;
    this.day = 1;
    this.tickAccumulator = 0;
  }

  create(): void {
    const { width, height } = this.scale;

    this.dayText = this.add.text(width /2, 50, `Day: ${this.day}`, {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);

    this.timeText = this.add.text(width /2, 100, 'Time: 0 ms', {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, 'Haunted House Tycoon', {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    this.timeElapsed += delta;
    this.tickAccumulator += delta;

    if (this.timeText) {
      this.timeText.setText(`Time: ${this.timeElapsed.toFixed(0)} ms`);
    }

    if (this.tickAccumulator >= 1000) {
      this.tickAccumulator -= 1000;
      this.day += 1;

      if (this.dayText) {
        this.dayText.setText(`Day: ${this.day}`)
      }
    }
  }
}
