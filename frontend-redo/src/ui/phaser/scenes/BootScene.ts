import { useGameStore } from '../../../runtime/store';

const MS_PER_TICK = 1000;
const MAX_STEPS_PER_FRAME = 10;

export class BootScene {
  // Phaser accepts a "key" string for scene identification.
  // (Using a static property avoids needing Phaser.Scene typing.)
  static key = 'boot';

  private accumulatedMs = 0;

  // Phaser will call create() when the scene starts.
  // At runtime (in the browser), `this` will be a Phaser.Scene instance.
  create() {
    // Use `any` here intentionally to avoid importing Phaser types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as any;

    self.add.text(20, 20, 'Phaser OK', {
      fontSize: '20px',
      color: '#ffffff',
    });
  }

  // Phase runs this every frame
  update(_time: number, delta: number) {
    if (!Number.isFinite(delta) || delta < 0) {
      throw new Error(`Invalid delta ${delta}`);
    }

    const state = useGameStore.getState();

    if (state.lifecycle !== 'running') return;

    const speed = state.speed;

    if (!Number.isFinite(speed) || speed <= 0) {
      throw new Error(`Invalid speed ${speed}`);
    }

    this.accumulatedMs += delta * speed;

    let steps = 0;
    while (this.accumulatedMs >= MS_PER_TICK) {
      useGameStore.getState().tickOnce();
      this.accumulatedMs -= MS_PER_TICK;

      steps++;
      if (steps > MAX_STEPS_PER_FRAME) {
        // guard from spiraling out of control
        throw new Error('Exceeded max tick steps per frame');
      }
    }
  }
}
