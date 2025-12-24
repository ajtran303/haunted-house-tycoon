import type { Grid, Visitor } from '../types';
import { applyEmotionDelta } from './emotions';
import { ROOM_EMOTION_EFFECTS } from './roomEffects';

const getRoomTypeAt = (grid: Grid, v: Visitor) => {
  const row = grid[v.position.y];
  const cell = row?.[v.position.x];
  return cell?.roomType ?? null;
};

export const applyRoomEmotionEffectsOnEntry = (
  visitors: readonly Visitor[],
  grid: Grid,
): Visitor[] => {
  return visitors.map((v) => {
    // Trigger only when entering a new tile
    const entered =
      v.prevPos != null && (v.prevPos.x !== v.position.x || v.prevPos.y !== v.position.y);

    if (!entered) return v;

    const roomType = getRoomTypeAt(grid, v);
    if (!roomType) return v;

    const delta = ROOM_EMOTION_EFFECTS[roomType];
    if (!delta) return v;

    return applyEmotionDelta(v, delta);
  });
};
