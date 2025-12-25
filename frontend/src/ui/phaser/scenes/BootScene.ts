import { useGameStore } from '../../../runtime/store';
import { bindExitToasts } from '../bindExitToasts';
import { bindHudOverlay } from '../bindHudOverlay';
import { bindPlacementFeedback } from '../bindPlacementFeedback';
import { bindVisitorHover } from '../bindVisitorHover';
import { createGridRenderer } from '../render/renderGrid';
import { createVisitorsRenderer } from '../render/visitorsRenderer';

const MS_PER_TICK = 1000;
const MAX_STEPS_PER_FRAME = 10;

export class BootScene {
  static key = 'boot';

  private accumulatedMs = 0;

  private unsubscribeGrid?: () => void;
  private unsubscribeLifecycle?: () => void;
  private unsubscribeVisitors?: () => void;
  private unsubscribeExitToasts?: () => void;
  private unsubscribePlacementFeedback?: () => void;
  private unsubHover?: () => void;

  private gridRenderer?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw: (grid: any) => void;
    destroy: () => void;
    setEnabled: (enabled: boolean) => void;
  };

  private visitorsRenderer?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw: (visitors: any) => void;
    destroy: () => void;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sceneRef: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingGrid?: any;
  private pendingRebuild = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingVisitors?: any;
  private pendingVisitorsFlush = false;

  private unsubHud?: () => void;

  create() {
    // pause when browser tab/window loses focus or is hidden.
    // it causes react components (ie. HUD) to become stale.
    const pauseIfRunning = () => {
      const s = useGameStore.getState();
      if (s.lifecycle === 'running') s.pause();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as any;
    this.sceneRef = self;

    self.game.events.on('blur', pauseIfRunning);

    const onVisibility = () => {
      if (document.hidden) pauseIfRunning();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).__cleanupVisibility = () => {
      self.game.events.off('blur', pauseIfRunning);
      document.removeEventListener('visibilitychange', onVisibility);
    };

    const TILE = 24;
    const GRID_X = 20;
    const GRID_Y = 60;

    this.unsubHud = bindHudOverlay(self, TILE, GRID_X, GRID_Y);

    self.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubHud?.();
      this.unsubHud = undefined;
    });

    const initial = useGameStore.getState();

    this.buildRenderer(initial.grid);
    this.gridRenderer?.setEnabled(initial.lifecycle === 'running');

    this.visitorsRenderer = createVisitorsRenderer(self);
    this.visitorsRenderer.draw(initial.visitors);

    this.unsubscribeGrid = useGameStore.subscribe(
      (s) => s.grid,
      (grid, prevGrid) => {
        const needsRebuild = grid !== prevGrid;
        this.queueGridWork(grid, needsRebuild);
      },
    );

    this.unsubscribeLifecycle = useGameStore.subscribe(
      (s) => s.lifecycle,
      (lifecycle) => {
        this.queueLifecycleWork(lifecycle === 'running');
        if (lifecycle !== 'running') this.accumulatedMs = 0;
      },
    );

    this.unsubscribeVisitors = useGameStore.subscribe(
      (s) => s.visitors,
      (visitors) => this.queueVisitorsWork(visitors),
    );

    this.unsubscribeExitToasts = bindExitToasts(this.sceneRef, TILE, 0, 0);
    this.unsubscribePlacementFeedback = bindPlacementFeedback(this.sceneRef, TILE, GRID_X, GRID_Y);

    this.unsubHover = bindVisitorHover(self, TILE, GRID_X, GRID_Y);

    self.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubHover?.();
      this.unsubHover = undefined;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildRenderer(grid: any) {
    const self = this.sceneRef;

    this.gridRenderer?.destroy();
    this.gridRenderer = createGridRenderer(self, grid, (x, y) => {
      useGameStore.getState().dispatchInput({ type: 'clickCell', x, y });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queueGridWork(grid: any, rebuild: boolean) {
    this.pendingGrid = grid;
    this.pendingRebuild = this.pendingRebuild || rebuild;

    const self = this.sceneRef;
    if (!self) return;

    if (self.__gridFlushScheduled) return;
    self.__gridFlushScheduled = true;

    self.events.once('postupdate', () => {
      self.__gridFlushScheduled = false;

      const g = this.pendingGrid;
      const doRebuild = this.pendingRebuild;

      this.pendingGrid = undefined;
      this.pendingRebuild = false;

      if (!g) return;

      if (doRebuild) {
        this.buildRenderer(g);
        this.gridRenderer?.setEnabled(useGameStore.getState().lifecycle === 'running');
      } else {
        this.gridRenderer?.draw(g);
      }
    });
  }

  private queueLifecycleWork(enabled: boolean) {
    const self = this.sceneRef;
    if (!self) return;

    if (self.__lifecycleFlushScheduled) {
      self.__pendingEnabled = enabled;
      return;
    }

    self.__lifecycleFlushScheduled = true;
    self.__pendingEnabled = enabled;

    self.events.once('postupdate', () => {
      self.__lifecycleFlushScheduled = false;
      this.gridRenderer?.setEnabled(!!self.__pendingEnabled);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queueVisitorsWork(visitors: any) {
    this.pendingVisitors = visitors;

    const self = this.sceneRef;
    if (!self) return;

    if (this.pendingVisitorsFlush) return;
    this.pendingVisitorsFlush = true;

    self.events.once('postupdate', () => {
      this.pendingVisitorsFlush = false;
      if (!this.pendingVisitors) return;

      this.visitorsRenderer?.draw(this.pendingVisitors);
      this.pendingVisitors = undefined;
    });
  }

  shutdown() {
    this.unsubscribeGrid?.();
    this.unsubscribeLifecycle?.();
    this.unsubscribeVisitors?.();
    this.unsubscribeExitToasts?.();
    this.unsubscribePlacementFeedback?.();
    this.unsubHover?.();
    this.unsubHud?.();

    this.gridRenderer?.destroy();
    this.visitorsRenderer?.destroy();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.sceneRef as any)?.__cleanupVisibility?.();
  }

  update(_time: number, delta: number) {
    if (!Number.isFinite(delta) || delta < 0) return;

    // Always read current state at time of update
    let state = useGameStore.getState();
    if (state.lifecycle !== 'running') {
      // Ensure no backlog builds up while paused/newGame
      this.accumulatedMs = 0;
      return;
    }

    const speed = state.speed;
    if (!Number.isFinite(speed) || speed <= 0) return;

    const clampedDelta = Math.min(delta, MS_PER_TICK * 2);
    this.accumulatedMs += clampedDelta * speed;

    let steps = 0;
    while (this.accumulatedMs >= MS_PER_TICK) {
      // IMPORTANT: re-check lifecycle each step (pause/newGame can happen mid-frame)
      state = useGameStore.getState();
      if (state.lifecycle !== 'running') {
        this.accumulatedMs = 0;
        break;
      }

      state.tickOnce();
      this.accumulatedMs -= MS_PER_TICK;

      steps++;
      if (steps >= MAX_STEPS_PER_FRAME) {
        this.accumulatedMs = 0;
        break;
      }
    }
  }
}
