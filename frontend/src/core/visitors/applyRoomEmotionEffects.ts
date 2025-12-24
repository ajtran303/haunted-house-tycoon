import type { Grid, RoomType, Visitor } from '../types';
import { applyEmotionDelta } from './emotions';
import { ROOM_EMOTION_EFFECTS } from './roomEffects';

const getRoomTypeAt = (grid: Grid, v: Visitor): RoomType | null => {
  const row = grid[v.position.y];
  const cell = row?.[v.position.x];
  return (cell?.roomType ?? null) as RoomType | null;
};

const didEnterNewTile = (v: Visitor) =>
  v.prevPos != null && (v.prevPos.x !== v.position.x || v.prevPos.y !== v.position.y);

export const applyRoomEmotionEffects = (visitors: Visitor[], grid: Grid): Visitor[] => {
  return visitors.map((v) => {
    const roomType = getRoomTypeAt(grid, v);
    if (!roomType) return v;

    // 1) Entry effects: apply once when stepping onto a new tile
    if (didEnterNewTile(v)) {
      const delta = ROOM_EMOTION_EFFECTS[roomType];
      return delta ? applyEmotionDelta(v, delta) : v;
    }

    // 2) Per-tick misery pressure when stuck in a room tile (no movement this tick)
    if (v.inAttraction && !didEnterNewTile(v)) {
      if (v.prevPos == null) return v;

      if (roomType === 'hallway') return applyEmotionDelta(v, { happiness: -1 });
      if (roomType === 'entry') return applyEmotionDelta(v, { happiness: -2 });
      if (roomType === 'scare') return applyEmotionDelta(v, { happiness: -1 });
    }

    return v;
  });
};
