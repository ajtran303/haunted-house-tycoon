/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ExitEvent } from '../../core/types';
import { useGameStore } from '../../runtime/store';

type Unsub = () => void;

let activeUnsub: Unsub | null = null;
let lastSeenId = 0;

export const bindExitToasts = (
  scene: Phaser.Scene,
  tileSize: number,
  gridOriginX = 0,
  gridOriginY = 0,
): Unsub => {
  unbindExitToasts();

  {
    const s = useGameStore.getState();
    const last = s.exitEvents[s.exitEvents.length - 1];
    lastSeenId = last ? last.id : 0;
  }

  const isSceneAlive = (): boolean => {
    const sys = (scene as any).sys;
    // Phaser versions vary; be conservative.
    if (!sys) return false;
    if ((sys as any).isDestroyed === true) return false;
    if (typeof (sys as any).isDestroyed === 'function' && (sys as any).isDestroyed()) return false;
    if (typeof (sys as any).isActive === 'function' && !(sys as any).isActive()) return false;
    if ((sys as any).settings && (sys as any).settings.status === 5) return false; // DESTROYED in some Phaser builds
    return true;
  };

  const safeEnqueueToast = (e: ExitEvent) => {
    (scene as any).time?.delayedCall?.(0, () => {
      if (!isSceneAlive()) return;
      const sys = (scene as any).sys;
      if (!sys?.displayList) return;
      if (!(scene as any).add?.text) return;

      showExitToast(scene, e, tileSize, gridOriginX, gridOriginY);
    });
  };

  activeUnsub = useGameStore.subscribe(
    (st) => st.exitEvents,
    (events) => {
      if (!isSceneAlive()) return;

      if (events.length === 0) {
        lastSeenId = 0;
        return;
      }

      const newestId = events[events.length - 1]!.id;

      if (newestId < lastSeenId) {
        lastSeenId = 0;
      }

      for (const e of events) {
        if (e.id > lastSeenId) {
          safeEnqueueToast(e);
          lastSeenId = e.id;
        }
      }
    },
  );

  return () => {
    if (activeUnsub) activeUnsub();
    activeUnsub = null;
  };
};

export const unbindExitToasts = () => {
  if (activeUnsub) activeUnsub();
  activeUnsub = null;
};

const showExitToast = (
  scene: Phaser.Scene,
  e: ExitEvent,
  tileSize: number,
  gridOriginX: number,
  gridOriginY: number,
) => {
  const sys = (scene as any).sys;
  if (!sys?.displayList) return;
  if (!(scene as any).add?.text) return;

  const wx = gridOriginX + e.position.x * tileSize + tileSize / 2;
  const wy = gridOriginY + e.position.y * tileSize + tileSize / 2;

  const label = e.reason === 'panic' ? 'PANIC!' : 'MISERABLE';

  const text = (scene as any).add.text(wx, wy, label, {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 6, y: 3 },
  });

  text.setOrigin(0.5, 0.5);
  text.setDepth(9999);

  (scene as any).tweens?.add?.({
    targets: text,
    y: wy - tileSize * 0.6,
    alpha: 0,
    duration: 450,
    onComplete: () => text.destroy(),
  });
};
