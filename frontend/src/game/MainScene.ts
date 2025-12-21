import Phaser from 'phaser';

export const MAIN_SCENE_KEY = 'MainScene';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super(MAIN_SCENE_KEY);
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, "Haunted House Tycoon", {
      color: '#ffffff',
      fontSize: '24px'
    }).setOrigin(0.5);
  }
}