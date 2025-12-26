import { useGameStore } from '../../../runtime/store';
import { bindExitToasts } from '../bindExitToasts';
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
  private unsubscribeView?: () => void;
  private unsubscribeHighlight?: () => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private highlightGraphic?: any;

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
    const GRID_Y = 100; // Must match ORIGIN_Y in renderGrid.ts and visitorsRenderer.ts

    // Expose scene for direct view rebuilds from React
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__bootScene = this;

    const initial = useGameStore.getState();

    const initialGrid = this.getGridForView(initial);
    this.buildRenderer(initialGrid);
    this.gridRenderer?.setEnabled(initial.lifecycle === 'running');

    this.visitorsRenderer = createVisitorsRenderer(self);
    this.visitorsRenderer.draw(this.getVisitorsForView(initial));

    // Subscribe to view changes - rebuild grid when switching views
    let lastViewKey =
      initial.currentView.type === 'midway'
        ? 'midway'
        : `attraction:${initial.currentView.attractionId}`;

    this.unsubscribeView = useGameStore.subscribe((state) => {
      const viewKey =
        state.currentView.type === 'midway'
          ? 'midway'
          : `attraction:${state.currentView.attractionId}`;

      if (viewKey !== lastViewKey) {
        lastViewKey = viewKey;
        this.rebuildForCurrentView();
      }
    });

    // Subscribe to the appropriate grid based on current view
    this.unsubscribeGrid = useGameStore.subscribe(
      (s) => this.getGridForView(s),
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
      (s) => this.getVisitorsForView(s),
      (visitors) => this.queueVisitorsWork(visitors),
    );

    this.unsubscribeExitToasts = bindExitToasts(this.sceneRef, TILE, GRID_X, GRID_Y);
    this.unsubscribePlacementFeedback = bindPlacementFeedback(this.sceneRef, TILE, GRID_X, GRID_Y);

    // Subscribe to cell highlight changes
    this.unsubscribeHighlight = useGameStore.subscribe(
      (s) => s.highlightedCell,
      (cell) => {
        this.drawHighlight(cell, TILE, GRID_X, GRID_Y);
      },
    );

    this.unsubHover = bindVisitorHover(self, TILE, GRID_X, GRID_Y);

    self.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubHover?.();
      this.unsubHover = undefined;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildRenderer(grid: any) {
    const self = this.sceneRef;

    // Safety check: ensure scene is active before creating game objects
    if (!self?.sys?.displayList) return;

    this.gridRenderer?.destroy();
    this.gridRenderer = createGridRenderer(self, grid, (x, y) => {
      useGameStore.getState().dispatchInput({ type: 'clickCell', x, y });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getGridForView(state: any) {
    if (state.currentView.type === 'midway') {
      return state.midwayGrid;
    }
    return state.attractions[state.currentView.attractionId]?.grid ?? state.midwayGrid;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getVisitorsForView(state: any) {
    const view = state.currentView;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return state.visitors.filter((v: any) => {
      if (view.type === 'midway') {
        return v.location.type === 'midway';
      }
      return v.location.type === 'attraction' && v.location.attractionId === view.attractionId;
    });
  }

  private rebuildForCurrentView() {
    const state = useGameStore.getState();
    const grid = this.getGridForView(state);
    this.buildRenderer(grid);
    this.gridRenderer?.setEnabled(state.lifecycle === 'running');
    this.visitorsRenderer?.draw(this.getVisitorsForView(state));
  }

  public forceViewRebuild() {
    this.rebuildForCurrentView();
  }

  private drawHighlight(
    cell: { x: number; y: number } | null,
    tile: number,
    gridX: number,
    gridY: number,
  ) {
    // Clear existing highlight
    if (this.highlightGraphic) {
      this.highlightGraphic.destroy();
      this.highlightGraphic = undefined;
    }

    if (!cell) return;

    const self = this.sceneRef;
    if (!self) return;

    // Draw a colored outline around the highlighted cell
    const x = gridX + cell.x * tile;
    const y = gridY + cell.y * tile;

    this.highlightGraphic = self.add.graphics();
    this.highlightGraphic.lineStyle(3, 0x00ff00, 1); // Green outline
    this.highlightGraphic.strokeRect(x, y, tile, tile);
    this.highlightGraphic.setDepth(100); // Above grid but below UI
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
    this.unsubscribeView?.();
    this.unsubscribeHighlight?.();

    this.gridRenderer?.destroy();
    this.visitorsRenderer?.destroy();
    this.highlightGraphic?.destroy();

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
