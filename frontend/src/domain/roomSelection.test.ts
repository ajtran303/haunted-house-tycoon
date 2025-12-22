import { describe, expect, it } from '@jest/globals';

import { DEFAULT_ROOM_SELECTION, reduceRoomSelection } from './roomSelection';

describe('room selection reducer', () => {
  it('defaults to hallway', () => {
    expect(DEFAULT_ROOM_SELECTION.selected).toBe('hallway');
  });

  it('selects entry on 1 (digit)', () => {
    const next = reduceRoomSelection(DEFAULT_ROOM_SELECTION, 'Digit1');
    expect(next.selected).toBe('entry');
  });

  it('selects hallway on 2 (digit)', () => {
    const next = reduceRoomSelection(DEFAULT_ROOM_SELECTION, 'Digit2');
    expect(next.selected).toBe('hallway');
  });

  it('selects scare on 3 (digit)', () => {
    const next = reduceRoomSelection(DEFAULT_ROOM_SELECTION, 'Digit3');
    expect(next.selected).toBe('scare');
  });

  it('supports numpad 1/2/3', () => {
    expect(reduceRoomSelection(DEFAULT_ROOM_SELECTION, 'Numpad1').selected).toBe('entry');
    expect(reduceRoomSelection(DEFAULT_ROOM_SELECTION, 'Numpad2').selected).toBe('hallway');
    expect(reduceRoomSelection(DEFAULT_ROOM_SELECTION, 'Numpad3').selected).toBe('scare');
  });

  it('is pure and does not mutate previous state', () => {
    const prev = { selected: 'hallway' as const };
    const next = reduceRoomSelection(prev, 'Digit1');

    expect(prev.selected).toBe('hallway');
    expect(next.selected).toBe('entry');
    expect(next).not.toBe(prev);
  });
});
