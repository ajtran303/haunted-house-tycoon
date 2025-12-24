import type { ExitEvent } from '../../core/types';
import { useGameStore } from '../../runtime/store';

export const bindExitToasts = (
  scene: Phaser.Scene,
  tileSize: number,
  gridOriginX = 0,
  gridOriginY = 0,
) => {
  // don't replay old events on scene start
  const s = useGameStore.getState();
  const last = s.exitEvents[s.exitEvents.length - 1];
  let lastSeenId = last ? last.id : 0;

  const unsub = useGameStore.subscribe(
    (st) => st.exitEvents,
    (events) => {
      // If the run reset (newGame), ids restart; reset our cursor too.
      if (events.length === 0) {
        lastSeenId = 0;
        return;
      }

      // If ids went backwards (new game), reset cursor.
      const newestId = events[events.length - 1]!.id;
      if (newestId < lastSeenId) {
        lastSeenId = 0;
      }

      const fresh = events.filter((e) => e.id > lastSeenId);
      if (fresh.length === 0) return;

      for (const e of fresh) {
        safeEnqueueToast(scene, e, tileSize, gridOriginX, gridOriginY);
        lastSeenId = Math.max(lastSeenId, e.id);
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
  if (!scene.sys) return;
  const status = scene.sys.settings?.status;
  if (status === 7 || status === 8) return;
  if (!scene.sys.displayList || !scene.add) return;

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

const safeEnqueueToast = (
  scene: Phaser.Scene,
  e: ExitEvent,
  tileSize: number,
  ox: number,
  oy: number,
) => {
  // Defer so we don't run inside zustand's synchronous setState call stack.
  scene.time.delayedCall(0, () => {
    if (!scene.sys) return;
    // status: 0=INIT, 1=START, 2=LOADING, 3=CREATING, 4=RUNNING, 5=PAUSED, 6=SLEEPING, 7=SHUTDOWN, 8=DESTROYED
    const status = scene.sys.settings?.status;
    if (status === 7 || status === 8) return;
    if (!scene.sys.displayList || !scene.add) return;

    showExitToast(scene, e, tileSize, ox, oy);
  });
};
