import type { Visitor } from '../../../core/types';

const CELL_SIZE = 24;
const ORIGIN_X = 20;
const ORIGIN_Y = 60;

type VisitorsRenderer = {
  draw: (visitors: Visitor[]) => void;
  destroy: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createVisitorsRenderer = (scene: any): VisitorsRenderer => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dots = new Map<number, any>();

  const draw = (visitors: Visitor[]) => {
    const alive = new Set<number>();

    for (const v of visitors) {
      alive.add(v.id);

      let dot = dots.get(v.id);
      if (!dot) {
        dot = scene.add.circle(0, 0, 4, 0xffcc00);
        dot.setDepth(10);
        dots.set(v.id, dot);
      }

      const px = ORIGIN_X + v.position.x * CELL_SIZE + CELL_SIZE / 2;
      const py = ORIGIN_Y + v.position.y * CELL_SIZE + CELL_SIZE / 2;

      dot.setPosition(px, py);
    }

    for (const [id, dot] of Array.from(dots)) {
      if (!alive.has(id)) {
        dot.destroy();
        dots.delete(id);
      }
    }
  };

  const destroy = () => {
    for (const dot of Array.from(dots.values())) dot.destroy();
    dots.clear();
  };

  return { draw, destroy };
};
