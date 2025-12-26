import type { AttractionGrid, Grid, RoomType, Visitor } from '../types';
import { applyEmotionDelta } from './emotions';
import { ROOM_EMOTION_EFFECTS } from './roomEffects';

const getRoomTypeAt = (grid: Grid, x: number, y: number): RoomType | null => {
  const row = grid[y];
  const cell = row?.[x];
  return (cell?.roomType ?? null) as RoomType | null;
};

const didEnterNewTile = (v: Visitor) =>
  v.prevPos != null && (v.prevPos.x !== v.position.x || v.prevPos.y !== v.position.y);

type GridLookup = {
  midwayGrid: Grid;
  attractions: Record<string, AttractionGrid>;
};

const getGridForVisitor = (v: Visitor, lookup: GridLookup): Grid | null => {
  if (v.location.type === 'midway') {
    return lookup.midwayGrid;
  }
  return lookup.attractions[v.location.attractionId]?.grid ?? null;
};

export const applyRoomEmotionEffects = (visitors: Visitor[], lookup: GridLookup): Visitor[] => {
  return visitors.map((v) => {
    const grid = getGridForVisitor(v, lookup);
    if (!grid) return v;

    const roomType = getRoomTypeAt(grid, v.position.x, v.position.y);
    if (!roomType) return v;

    // 1) Entry effects: apply once when stepping onto a new tile
    if (didEnterNewTile(v)) {
      const delta = ROOM_EMOTION_EFFECTS[roomType];
      return delta ? applyEmotionDelta(v, delta) : v;
    }

    // 2) Per-tick misery pressure when stuck in a room tile (no movement this tick)
    if (v.location.type === 'attraction' && !didEnterNewTile(v)) {
      if (v.prevPos == null) return v;

      if (roomType === 'hallway') return applyEmotionDelta(v, { happiness: -1 });
      if (roomType === 'entry') return applyEmotionDelta(v, { happiness: -2 });
      if (roomType === 'scare') return applyEmotionDelta(v, { happiness: -1 });
    }

    return v;
  });
};
