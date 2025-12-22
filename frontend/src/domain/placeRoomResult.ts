export type PlaceRoomResult =
  | { ok: true; roomId: string }
  | { ok: false; reason: 'unknown_room_type' | 'out_of_bounds' | 'cell_occupied' | 'cell_not_empty' | 'not_enough_money' };
