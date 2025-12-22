export type FlashCellFeedback = { type: 'flash_cell'; x: number; y: number };
export type ToastFeedback = { type: 'toast'; message: string };

export type FailureReason =
  | 'unknown_room_type'
  | 'out_of_bounds'
  | 'cell_occupied'
  | 'cell_not_empty'
  | 'not_enough_money';

export type PlaceRoomResult =
  | { ok: true; roomId: string }
  | { ok: false; reason: FailureReason; feedback: FlashCellFeedback | ToastFeedback };
