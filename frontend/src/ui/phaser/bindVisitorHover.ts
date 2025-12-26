import { useGameStore } from '../../runtime/store';
import { getVisitorMood, VisitorMood } from '../../ui/visitorMood';

// Tune these to match your actual constants later
const moodLabel = (m: VisitorMood): string => {
  switch (m) {
    case 'happy':
      return 'HAPPY';
    case 'neutral':
      return 'NEUTRAL';
    case 'unhappy':
      return 'UNHAPPY';
    case 'miserable':
      return 'MISERABLE';
    case 'anxious':
      return 'ANXIOUS';
    case 'scared':
      return 'SCARED';
  }
};

const gridFromPointer = (
  scene: Phaser.Scene,
  pointer: Phaser.Input.Pointer,
  tileSize: number,
  gridOriginX: number,
  gridOriginY: number,
) => {
  const wx = pointer.worldX;
  const wy = pointer.worldY;

  const gx = Math.floor((wx - gridOriginX) / tileSize);
  const gy = Math.floor((wy - gridOriginY) / tileSize);

  return { gx, gy };
};

export const bindVisitorHover = (
  scene: Phaser.Scene,
  tileSize: number,
  gridOriginX = 20,
  gridOriginY = 60,
) => {
  const tip = scene.add.text(0, 0, '', {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 6, y: 3 },
  });
  tip.setDepth(10000);
  tip.setScrollFactor(0); // stays in screen space
  tip.setVisible(false);

  let lastKey = ''; // "x,y" of last hovered cell

  const onMove = (pointer: Phaser.Input.Pointer) => {
    // Don’t show hover when scene is not active
    if (!scene?.sys?.isActive()) return;

    const { gx, gy } = gridFromPointer(scene, pointer, tileSize, gridOriginX, gridOriginY);

    // If pointer is outside the grid, hide
    const st = useGameStore.getState();
    const h = st.midwayGrid.length;
    const w = st.midwayGrid[0]?.length ?? 0;
    if (gx < 0 || gy < 0 || gx >= w || gy >= h) {
      if (tip.visible) tip.setVisible(false);
      lastKey = '';
      return;
    }

    const key = `${gx},${gy}`;
    if (key === lastKey) {
      // Still hovering same cell; just keep tooltip near cursor
      if (tip.visible) {
        tip.setPosition(pointer.x + 12, pointer.y + 12);
      }
      return;
    }
    lastKey = key;

    const v = st.visitors.find((vv) => vv.position.x === gx && vv.position.y === gy);

    if (!v) {
      tip.setVisible(false);
      return;
    }

    const mood = getVisitorMood(v);
    const text = `VISITOR ${v.id}\n${moodLabel(mood)}\nF:${v.fear} H:${v.happiness}`; // remove stats after dev

    tip.setText(text);
    tip.setPosition(pointer.x + 12, pointer.y + 12);
    tip.setVisible(true);
  };

  const onOut = () => {
    tip.setVisible(false);
    lastKey = '';
  };

  scene.input.on('pointermove', onMove);
  scene.input.on('pointerout', onOut);

  // Cleanup
  const cleanup = () => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerout', onOut);
    tip.destroy();
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

  return cleanup;
};
