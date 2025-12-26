import type { Visitor } from '../../../core/types';
import { getVisitorMood, VisitorMood } from '../../visitorMood';

const CELL_SIZE = 24;
const ORIGIN_X = 20;
const ORIGIN_Y = 80; // Account for React top bar

type VisitorsRenderer = {
  draw: (visitors: Visitor[]) => void;
  destroy: () => void;
};

// Dev only
const SHOW_INTENT = true;

const MOOD_COLOR: Record<VisitorMood, number> = {
  happy: 0x7cff6b, // bright lime green (distinct from entry green)
  neutral: 0xffd966, // warm gold (strong contrast on dark + gray)
  unhappy: 0x4fc3ff, // cyan-blue (clearly not park-entry blue)
  miserable: 0x2b6cb0, // deep desaturated blue (distinct from park entry)
  anxious: 0xe0b3ff, // light lavender (contrasts with scare purple)
  scared: 0xb23aee, // hot purple-magenta (distinct from scare tile)
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
      if (SHOW_INTENT) {
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

    if (SHOW_INTENT) {
      for (const [id, label] of Array.from(intentLabels)) {
        if (!alive.has(id)) {
          label.destroy();
          intentLabels.delete(id);
        }
      }
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
