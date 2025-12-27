import type { Visitor } from '../../../core/types';
import { DEV_MODE, devConfig } from '../../../dev/devMode';
import { getVisitorMood, VisitorMood } from '../../visitorMood';
import { getCurrentCellSize, GRID_ORIGIN_X, GRID_ORIGIN_Y } from '../gridSizing';

type VisitorsRenderer = {
  draw: (visitors: Visitor[]) => void;
  destroy: () => void;
};

// Colorblind-friendly mood colors
// Distinct from room tile colors for visibility
const MOOD_COLOR: Record<VisitorMood, number> = {
  happy: 0x98fb98, // pale green - distinct from yellow portal
  neutral: 0xffffff, // white - baseline
  unhappy: 0xda70d6, // orchid - distinct from reddish purple exit
  miserable: 0x4169e1, // royal blue - cold/sad, distinct from sky blues
  anxious: 0xffc107, // amber - distinct from orange scare
  scared: 0xff5252, // bright red - distinct from vermillion park exit
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createVisitorsRenderer = (scene: any): VisitorsRenderer => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dots = new Map<number, any>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intentLabels = new Map<number, any>();

  const draw = (visitors: Visitor[]) => {
    const alive = new Set<number>();
    const CELL_SIZE = getCurrentCellSize();

    for (const v of visitors) {
      alive.add(v.id);

      // --- dot ---
      let dot = dots.get(v.id);
      if (!dot) {
        dot = scene.add.circle(0, 0, 6, MOOD_COLOR.neutral); // Slightly larger dot for scaled grid
        dot.setDepth(10);
        dots.set(v.id, dot);
      }

      const px = GRID_ORIGIN_X + v.position.x * CELL_SIZE + CELL_SIZE / 2;
      const py = GRID_ORIGIN_Y + v.position.y * CELL_SIZE + CELL_SIZE / 2;

      dot.setPosition(px, py);

      // --- mood-based color ---
      const mood = getVisitorMood(v);
      dot.setFillStyle(MOOD_COLOR[mood], 1);

      // --- intent label (dev-only) ---
      if (DEV_MODE && devConfig.showVisitorIntent) {
        let label = intentLabels.get(v.id);
        if (!label) {
          label = scene.add.text(0, 0, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
          });
          label.setOrigin(0.5, 1); // centered, anchored above
          label.setDepth(11); // above the dot
          intentLabels.set(v.id, label);
        }

        const text = v.intent === 'exit' ? 'X' : 'E';
        if (label.text !== text) label.setText(text);

        // Slightly above the dot
        label.setPosition(px, py - CELL_SIZE * 0.35);
      }
    }

    // cleanup removed visitors
    for (const [id, dot] of Array.from(dots)) {
      if (!alive.has(id)) {
        dot.destroy();
        dots.delete(id);
      }
    }

    // Cleanup intent labels
    if (DEV_MODE && devConfig.showVisitorIntent) {
      // Remove labels for dead visitors
      for (const [id, label] of Array.from(intentLabels)) {
        if (!alive.has(id)) {
          label.destroy();
          intentLabels.delete(id);
        }
      }
    } else {
      // Clear all labels when intent display is disabled
      for (const label of Array.from(intentLabels.values())) {
        label.destroy();
      }
      intentLabels.clear();
    }
  };

  const destroy = () => {
    for (const dot of Array.from(dots.values())) dot.destroy();
    dots.clear();

    for (const label of Array.from(intentLabels.values())) label.destroy();
    intentLabels.clear();
  };

  return { draw, destroy };
};
