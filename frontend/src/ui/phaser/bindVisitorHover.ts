import { useGameStore } from '../../runtime/store';
import { getVisitorMood, VisitorMood } from '../../ui/visitorMood';
import { getCurrentCellSize, GRID_ORIGIN_X, GRID_ORIGIN_Y } from './gridSizing';

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

const gridFromPointer = (scene: Phaser.Scene, pointer: Phaser.Input.Pointer) => {
  const tileSize = getCurrentCellSize();
  const wx = pointer.worldX;
  const wy = pointer.worldY;

  const gx = Math.floor((wx - GRID_ORIGIN_X) / tileSize);
  const gy = Math.floor((wy - GRID_ORIGIN_Y) / tileSize);

  return { gx, gy };
};

export const bindVisitorHover = (scene: Phaser.Scene) => {
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
    // Don't show hover when scene is not active
    if (!scene?.sys?.isActive()) return;

    const { gx, gy } = gridFromPointer(scene, pointer);

    // If pointer is outside the grid, hide
    const st = useGameStore.getState();
    const currentGrid =
      st.currentView.type === 'midway'
        ? st.midwayGrid
        : (st.attractions[st.currentView.attractionId]?.grid ?? st.midwayGrid);
    const h = currentGrid.length;
    const w = currentGrid[0]?.length ?? 0;
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
    const text = `VISITOR ${v.id}\n${moodLabel(mood)}\nH:${v.happiness} F:${v.fear}`; // remove stats after dev or keep for player clarity

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
