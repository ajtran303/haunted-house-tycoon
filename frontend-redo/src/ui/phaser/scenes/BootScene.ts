import Phaser from 'phaser';

import { useGameStore } from '../../../runtime/store';

const MS_PER_TICK = 1000;

export class BootScene extends Phaser.Scene {
  private accumulatedMs = 0;

  constructor() {
    super('boot');
  }

  // Phaser will call create() when the scene starts.
  // At runtime (in the browser), `this` will be a Phaser.Scene instance.
  create() {
    this.add.text(20, 20, 'Phaser OK', {
      fontSize: '20px',
      color: '#ffffff',
    });
  }

  // Phase runs this every frame
  update(_time: number, delta: number) {
    this.accumulatedMs += delta;

    while (this.accumulatedMs >= MS_PER_TICK) {
      useGameStore.getState().tickOnce();
      this.accumulatedMs -= MS_PER_TICK;
    }
  }
}
