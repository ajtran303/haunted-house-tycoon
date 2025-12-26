import type { Visitor } from '../../../core/types';
import { DEV_MODE, devConfig } from '../../../dev/devMode';
import { getVisitorMood, VisitorMood } from '../../visitorMood';

const CELL_SIZE = 24;
const ORIGIN_X = 20;
const ORIGIN_Y = 100; // Account for React top bar (3 rows: header, stats, emotions)

type VisitorsRenderer = {
  draw: (visitors: Visitor[]) => void;
  destroy: () => void;
};

// Colorblind-friendly mood colors (Wong palette based)
// Emphasizes luminance differences and avoids red-green confusion
const MOOD_COLOR: Record<VisitorMood, number> = {
  happy: 0xf0e442, // bright yellow - positive, high visibility
  neutral: 0xffffff, // white - baseline state (visible on gray hallways)
  unhappy: 0xcc79a7, // reddish purple - happiness declining
  miserable: 0x0072b2, // deep blue - very low happiness (cold/sad)
  anxious: 0xe69f00, // orange - fear rising (warning)
  scared: 0xd55e00, // vermillion - high fear (danger!)
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createVisitorsRenderer = (scene: any): VisitorsRenderer => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dots = new Map<number, any>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intentLabels = new Map<number, any>();

  const draw = (visitors: Visitor[]) => {
    const alive = new Set<number>();

    for (const v of visitors) {
      alive.add(v.id);

      // --- dot ---
      let dot = dots.get(v.id);
      if (!dot) {
        dot = scene.add.circle(0, 0, 4, MOOD_COLOR.neutral);
        dot.setDepth(10);
        dots.set(v.id, dot);
      }

      const px = ORIGIN_X + v.position.x * CELL_SIZE + CELL_SIZE / 2;
      const py = ORIGIN_Y + v.position.y * CELL_SIZE + CELL_SIZE / 2;

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
            fontSize: '12px',
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
