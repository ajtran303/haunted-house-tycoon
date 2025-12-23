import { useGameStore } from '../../../runtime/store';
import { createGridRenderer } from '../render/renderGrid';

const MS_PER_TICK = 1000;
const MAX_STEPS_PER_FRAME = 10;

export class BootScene {
  static key = 'boot';

  private accumulatedMs = 0;
  private unsubscribeGrid?: () => void;
  private unsubscribeLifecycle?: () => void;

  private gridRenderer?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw: (grid: any) => void;
    destroy: () => void;
    setEnabled: (enabled: boolean) => void;
  };

  create() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as any;

    self.add.text(20, 20, 'Phaser OK', { fontSize: '20px', color: '#ffffff' });

    const initial = useGameStore.getState();

    this.gridRenderer = createGridRenderer(self, initial.grid, (x, y) => {
      useGameStore.getState().dispatchInput({ type: 'clickCell', x, y });
    });

    this.gridRenderer.setEnabled(initial.lifecycle === 'running');

    this.unsubscribeGrid = useGameStore.subscribe(
      (s) => s.grid,
      (grid) => this.gridRenderer?.draw(grid),
    );

    this.unsubscribeLifecycle = useGameStore.subscribe(
      (s) => s.lifecycle,
      (lifecycle) => this.gridRenderer?.setEnabled(lifecycle === 'running'),
    );
  }

  shutdown() {
    this.unsubscribeGrid?.();
    this.unsubscribeLifecycle?.();
    this.gridRenderer?.destroy();
  }

  update(_time: number, delta: number) {
    if (!Number.isFinite(delta) || delta < 0) throw new Error(`Invalid delta ${delta}`);

    const state = useGameStore.getState();
    if (state.lifecycle !== 'running') return;

    const speed = state.speed;
    if (!Number.isFinite(speed) || speed <= 0) throw new Error(`Invalid speed ${speed}`);

    this.accumulatedMs += delta * speed;

    let steps = 0;
    while (this.accumulatedMs >= MS_PER_TICK) {
      useGameStore.getState().tickOnce();
      this.accumulatedMs -= MS_PER_TICK;

      steps++;
      if (steps > MAX_STEPS_PER_FRAME) throw new Error('Exceeded max tick steps per frame');
    }
  }
}
