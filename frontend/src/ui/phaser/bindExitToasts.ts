import type { ExitEvent } from '../../core/types';
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

export const bindExitToasts = (
  scene: Phaser.Scene,
  tileSize: number,
  gridOriginX = 20,
  gridOriginY = 60,
) => {
  // Don’t replay old events on initial bind.
  const initial = useGameStore.getState();
  const last = initial.exitEvents[initial.exitEvents.length - 1];
  let lastSeenId = last ? last.id : 0;

  const safeEnqueueToast = (e: ExitEvent) => {
    // Defer so we don't run inside zustand's synchronous setState call stack.
    // If time isn't available (should be), fall back to immediate.
    const enqueue = () => {
      if (!isRenderableScene(scene)) return;
      showExitToast(scene, e, tileSize, gridOriginX, gridOriginY);
    };

    if (scene.time?.delayedCall) scene.time.delayedCall(0, enqueue);
    else enqueue();
  };

  const unsub = useGameStore.subscribe(
    (st) => st.exitEvents,
    (events) => {
      // New game clears events => reset cursor so new run can show toasts.
      if (events.length === 0) {
        lastSeenId = 0;
        return;
      }

      const newestId = events[events.length - 1]!.id;

      // If IDs restarted (newGame), reset cursor.
      if (newestId < lastSeenId) {
        lastSeenId = 0;
      }

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

const showExitToast = (
  scene: Phaser.Scene,
  e: ExitEvent,
  tileSize: number,
  gridOriginX: number,
  gridOriginY: number,
) => {
  if (!isRenderableScene(scene)) return;

  const wx = gridOriginX + e.position.x * tileSize + tileSize / 2;
  const wy = gridOriginY + e.position.y * tileSize + tileSize / 2;

  const label = e.reason === 'panic' ? 'PANIC!' : 'MISERABLE';

  const text = scene.add.text(wx, wy, label, {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 6, y: 3 },
  });

  text.setOrigin(0.5, 0.5);
  text.setDepth(9999);

  scene.tweens.add({
    targets: text,
    y: wy - tileSize * 0.6,
    alpha: 0,
    duration: 450,
    onComplete: () => text.destroy(),
  });
};
