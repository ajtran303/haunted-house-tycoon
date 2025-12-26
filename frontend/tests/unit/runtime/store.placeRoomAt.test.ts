import { ROOM_COST, STARTING_MONEY } from '../../../src/core/constants';
import { useGameStore } from '../../../src/runtime/store';

describe('store.placeRoomAt', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
    useGameStore.getState().startRun();
  });

  it('places a room on an empty cell, deducts money, increments nextRoomId', () => {
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'hallway' });

    const before = useGameStore.getState();
    const beforeMoney = before.money;
    const beforeNextRoomId = before.nextRoomId;

    useGameStore.getState().placeRoomAt(2, 3);

    const after = useGameStore.getState();
    expect(after.nextRoomId).toBe(beforeNextRoomId + 1);
    expect(after.money).toBe(beforeMoney - ROOM_COST.hallway);

    const placed = after.midwayGrid[3][2];
    expect(placed.occupied).toBe(true);
    expect(placed.roomId).toBe(`hallway-${beforeNextRoomId}`);
  });

  it('does nothing if cell is already occupied', () => {
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'hallway' });

    // First placement succeeds
    useGameStore.getState().placeRoomAt(1, 1);

    const mid = useGameStore.getState();
    const moneyAfterFirst = mid.money;
    const nextRoomIdAfterFirst = mid.nextRoomId;
    const roomIdAfterFirst = mid.midwayGrid[1][1].roomId;

    // Second placement on same cell should no-op
    useGameStore.getState().placeRoomAt(1, 1);

    const after = useGameStore.getState();
    expect(after.money).toBe(moneyAfterFirst);
    expect(after.nextRoomId).toBe(nextRoomIdAfterFirst);
    expect(after.midwayGrid[1][1].roomId).toBe(roomIdAfterFirst);
  });

  it('does nothing if out of bounds', () => {
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'hallway' });

    const before = useGameStore.getState();
    const beforeMoney = before.money;
    const beforeNextRoomId = before.nextRoomId;

    useGameStore.getState().placeRoomAt(-1, 0);

    const after = useGameStore.getState();
    expect(after.money).toBe(beforeMoney);
    expect(after.nextRoomId).toBe(beforeNextRoomId);
    expect(after.midwayGrid).toEqual(before.midwayGrid);
  });

  it('does nothing if insufficient funds', () => {
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'scare' });

    useGameStore.setState({ money: 0 });

    const before = useGameStore.getState();
    const beforeNextRoomId = before.nextRoomId;

    useGameStore.getState().placeRoomAt(0, 0);

    const after = useGameStore.getState();
    expect(after.money).toBe(0);
    expect(after.nextRoomId).toBe(beforeNextRoomId);
    expect(after.midwayGrid[0][0].occupied).toBe(false);
    expect(after.midwayGrid[0][0].roomId).toBeNull();
  });

  it('uses the currently selectedRoomType', () => {
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'entry' });

    const roomId = useGameStore.getState().nextRoomId;

    useGameStore.getState().placeRoomAt(4, 4);

    const after = useGameStore.getState();
    expect(after.midwayGrid[4][4].roomId).toBe(`entry-${roomId}`);
    expect(after.money).toBe(STARTING_MONEY - ROOM_COST.entry);
  });
});
