import { useGameStore } from '../../runtime/store';
import { selectCriticalSnapshot, selectHudSnapshot } from '../hud/selectors';

const isRenderableScene = (scene: Phaser.Scene): boolean => {
  if (!scene?.sys) return false;
  const status = scene.sys.settings?.status;
  // 7=SHUTDOWN, 8=DESTROYED
  if (status === 7 || status === 8) return false;
  if (!scene.sys.displayList) return false;
  if (!scene.add) return false;
  return true;
};

export const bindHudOverlay = (
  scene: Phaser.Scene,
  tileSize: number,
  gridOriginX = 20,
  gridOriginY = 60,
) => {
  if (!isRenderableScene(scene)) return () => {};

  // HUD pinned at top-left
  const hudLayer = scene.add.container(12, 10);
  hudLayer.setScrollFactor(0);
  hudLayer.setDepth(10_000);

  // Warnings pinned under the playable grid (screen-space)
  const warnLayer = scene.add.container(gridOriginX, gridOriginY);
  warnLayer.setScrollFactor(0);
  warnLayer.setDepth(10_000);

  const hudText = scene.add.text(0, 0, '', {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 8, y: 6 },
  });

  const warnText = scene.add.text(0, 0, '', {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 8, y: 6 },
  });

  warnText.setVisible(false);

  // Self-clearing/dismissible: click hides current banner (does not block sim)
  warnText.setInteractive({ useHandCursor: true });
  warnText.on('pointerdown', () => {
    warnText.setVisible(false);
    warnText.setText('');
  });

  hudLayer.add([hudText]);
  warnLayer.add([warnText]);

  const render = () => {
    const st = useGameStore.getState();

    // Position warnings under current grid height (safe even if grid changes)
    const gridH = st.midwayGrid.length;
    const warnY = gridOriginY + gridH * tileSize + 8; // margin under grid
    warnLayer.setPosition(gridOriginX, warnY);

    const hud = selectHudSnapshot(st);
    hudText.setText(
      [
        `MONEY: $${hud.money}`,
        `VISITORS: ${hud.visitorCount}`,
        `AVG HAPPY: ${hud.avgHappiness.toFixed(0)}`,
        `AVG FEAR: ${hud.avgFear.toFixed(0)}`,
      ].join('  |  '),
    );

    const crit = selectCriticalSnapshot(st);
    const msgs: string[] = [];

    // money warnings
    if (crit.flags.has('bankruptcy_imminent')) {
      const runway = crit.runwayTicks > 0 ? `${crit.runwayTicks} ticks` : 'NOW';
      msgs.push(`BANKRUPTCY IMMINENT (${runway})`);
    } else if (crit.flags.has('money_low')) msgs.push('MONEY LOW');

    // risk warnings
    if (crit.flags.has('fear_high')) msgs.push('FEAR HIGH');

    // outcome warnings (real exits + deaths)
    if (crit.flags.has('exiting_rapidly')) msgs.push(`EXITS SPIKING (${crit.exitsInWindow})`);

    if (crit.flags.has('deaths_spiking')) {
      msgs.push(`DEATHS SPIKING (${crit.deathsInWindow})`);
      // optional details
      // msgs.push(`PANIC: ${crit.panicInWindow} MISERY: ${crit.miseryInWindow}`);
    }

    if (msgs.length) {
      warnText.setText(msgs.join('  |  '));
      warnText.setVisible(true);
    } else {
      warnText.setVisible(false);
      warnText.setText('');
    }
  };

  // initial
  render();

  // Update immediately on real state change (keep selector truthful).
  // Minimal subscribe: include lengths + tick so averages update as visitors change.
  const unsub = useGameStore.subscribe(
    (st) => ({
      money: st.money,
      tick: st.tick,
      visitorsLen: st.visitors.length,
      exitEventsLen: st.exitEvents.length,
      parkExitEventsLen: st.parkExitEvents.length,
      lifecycle: st.lifecycle,
      speed: st.speed,
      gridH: st.midwayGrid.length,
    }),
    () => {
      const enqueue = () => {
        if (!isRenderableScene(scene)) return;
        render();
      };
      // defer out of zustand setState stack
      if (scene.time?.delayedCall) scene.time.delayedCall(0, enqueue);
      else enqueue();
    },
  );

  const cleanup = () => {
    unsub();
    hudLayer.destroy(true);
    warnLayer.destroy(true);
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  return cleanup;
};
