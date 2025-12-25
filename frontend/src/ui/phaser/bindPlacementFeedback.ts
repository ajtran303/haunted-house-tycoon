import type { PlacementEvent, PlacementFailReason } from '../../core/types';
import { useGameStore } from '../../runtime/store';

const isRenderableScene = (scene: Phaser.Scene): boolean => {
  if (!scene?.sys) return false;

  // Phaser status: 0=INIT,1=START,2=LOADING,3=CREATING,4=RUNNING,5=PAUSED,6=SLEEPING,7=SHUTDOWN,8=DESTROYED
  const status = scene.sys.settings?.status;

  // If the scene is shutting down/destroyed, never try to add display objects.
  if (status === 7 || status === 8) return false;

  // These are required for `add.text` to work.
  if (!scene.sys.displayList) return false;
  if (!scene.add) return false;

  return true;
};

const placementFailLabel = (reason: PlacementFailReason): string => {
  switch (reason) {
    case 'out_of_bounds':
      return 'OUT OF BOUNDS';
    case 'cell_occupied':
      return 'CELL OCCUPIED';
    case 'insufficient_funds':
      return 'NOT ENOUGH $';
    case 'invalid_entrance_placement':
      return 'BAD ENTRANCE';
    case 'invalid_exit_placement':
      return 'BAD EXIT';
    case 'entrance_already_exists':
      return 'ENTRANCE EXISTS';
    case 'exit_already_exists':
      return 'EXIT EXISTS';
    default:
      return 'CANNOT PLACE';
  }
};

export const bindPlacementFeedback = (
  scene: Phaser.Scene,
  tileSize: number,
  gridOriginX = 20,
  gridOriginY = 60,
) => {
  // Don’t replay old events on initial bind.
  const initial = useGameStore.getState();
  const last = initial.placementEvents[initial.placementEvents.length - 1];
  let lastSeenId = last ? last.id : 0;

  const safeEnqueueToast = (e: PlacementEvent) => {
    const enqueue = () => {
      if (!isRenderableScene(scene)) return;
      showPlacementFeedbackToast(scene, e, tileSize, gridOriginX, gridOriginY);
    };

    if (scene.time?.delayedCall) scene.time.delayedCall(0, enqueue);
    else enqueue();
  };

  const unsub = useGameStore.subscribe(
    (st) => st.placementEvents,
    (events) => {
      // New game clears events => reset cursor so new run can show toasts.
      if (events.length === 0) {
        lastSeenId = 0;
        return;
      }

      const newestId = events[events.length - 1]!.id;

      // If IDs restarted (newGame), reset cursor.
      if (newestId < lastSeenId) lastSeenId = 0;

      // Emit fresh events in order.
      for (const e of events) {
        if (e.id > lastSeenId) {
          safeEnqueueToast(e);
          lastSeenId = e.id; // advance cursor monotonically
        }
      }
    },
  );

  return () => unsub();
};

const showPlacementFeedbackToast = (
  scene: Phaser.Scene,
  e: PlacementEvent,
  tileSize: number,
  gridOriginX: number,
  gridOriginY: number,
) => {
  if (!isRenderableScene(scene)) return;

  const cellX = gridOriginX + e.position.x * tileSize;
  const cellY = gridOriginY + e.position.y * tileSize;

  const wx = cellX + tileSize / 2;
  const wy = cellY + tileSize / 2;

  const label = placementFailLabel(e.reason);

  // Flash rect (correctly aligned to cell top-left)
  const rect = scene.add
    .rectangle(cellX, cellY, tileSize - 1, tileSize - 1)
    .setOrigin(0, 0)
    .setFillStyle(0xff0000, 0.25)
    .setStrokeStyle(3, 0xff0000, 1)
    .setDepth(9998);

  scene.tweens.add({
    targets: rect,
    alpha: 0,
    duration: 220,
    yoyo: true,
    repeat: 1,
    onComplete: () => rect.destroy(),
  });

  // On-cell toast (anchored at cell center)
  const text = scene.add.text(wx, wy, label, {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 6, y: 3 },
  });

  text.setOrigin(0.5, 0.5);
  text.setDepth(9999);

  // Non-blocking: float up slightly + fade out + destroy
  scene.tweens.add({
    targets: text,
    y: wy - 10,
    alpha: 0,
    duration: 650,
    ease: 'Quad.easeOut',
    onComplete: () => text.destroy(),
  });
};
