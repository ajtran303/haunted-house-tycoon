// tests/unit/runtime/store.entranceSpawn.test.ts
import { ADMISSION_FEE, MONEY_PER_VISITOR_PER_TICK, ROOM_COST } from '../../../src/core/constants';
import { useGameStore } from '../../../src/runtime/store';

const selectCore = () => {
  const s = useGameStore.getState();
  return {
    lifecycle: s.lifecycle,
    money: s.money,
    tick: s.tick,
    day: s.day,
    grid: s.grid,
    visitors: s.visitors,
    nextVisitorId: s.nextVisitorId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entrance: (s as any).entrance as { x: number; y: number } | null, // adjust type if needed
    nextRoomId: s.nextRoomId,
    selectedRoomType: s.selectedRoomType,
  };
};

describe('Entrance placement + spawn gating', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  describe('Entrance placement', () => {
    it('does not allow placing entrance when paused', () => {
      // paused by default after newGame()
      useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });

      const before = selectCore();
      const beforeCell = before.grid[0][0];

      useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });

      const after = selectCore();

      // no-op on pause
      expect(after.lifecycle).toBe('paused');
      expect(after.money).toBe(before.money);
      expect(after.nextRoomId).toBe(before.nextRoomId);

      // grid unchanged at that cell (strong enough for no-op)
      expect(after.grid[0][0]).toEqual(beforeCell);

      // entrance should still be unset
      expect(after.entrance).toBeNull();
    });

    it('rejects entrance placement when not on an edge', () => {
      useGameStore.getState().startRun();
      useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });

      const before = selectCore();
      const x = 2;
      const y = 2; // interior, assuming grid is at least 5x5

      const beforeCell = before.grid[y][x];

      useGameStore.getState().dispatchInput({ type: 'clickCell', x, y });

      const after = selectCore();

      expect(after.money).toBe(before.money); // no charge
      expect(after.nextRoomId).toBe(before.nextRoomId);
      expect(after.grid[y][x]).toEqual(beforeCell);
      expect(after.entrance).toBeNull();
    });

    it('allows entrance placement on an edge cell (top edge)', () => {
      useGameStore.getState().startRun();
      useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });

      const before = selectCore();
      const x = 2;
      const y = 0;

      useGameStore.getState().dispatchInput({ type: 'clickCell', x, y });

      const after = selectCore();

      // cell becomes occupied parkEntry
      expect(after.grid[y][x].occupied).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((after.grid[y][x] as any).roomType).toBe('parkEntry');

      // entrance coord stored
      expect(after.entrance).toEqual({ x, y });

      // money deducted like a normal room placement (adjust if entrance is free)
      expect(after.money).toBe(before.money - ROOM_COST.parkEntry);

      // room id increments
      expect(after.nextRoomId).toBe(before.nextRoomId + 1);
    });

    it('cannot place a second entrance (no-op)', () => {
      useGameStore.getState().startRun();
      useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });

      // place first entrance
      useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });
      const mid = selectCore();
      expect(mid.entrance).toEqual({ x: 0, y: 0 });

      // attempt second entrance
      const beforeSecond = selectCore();
      useGameStore.getState().dispatchInput({ type: 'clickCell', x: 4, y: 0 });

      const after = selectCore();

      // entrance unchanged
      expect(after.entrance).toEqual({ x: 0, y: 0 });

      // second cell should not become another entrance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((after.grid[0][4] as any).roomType).not.toBe('parkEntry');

      // no money spent / ids unchanged on rejected attempt
      expect(after.money).toBe(beforeSecond.money);
      expect(after.nextRoomId).toBe(beforeSecond.nextRoomId);
    });
  });

  describe('Spawn gating', () => {
    it('does not spawn on tick 1 if no entrance exists', () => {
      useGameStore.getState().startRun();

      const before = selectCore();
      expect(before.entrance).toBeNull();

      useGameStore.getState().tickOnce(); // tick -> 1

      const after = selectCore();

      expect(after.tick).toBe(before.tick + 1);
      expect(after.visitors.length).toBe(0);
      expect(after.money).toBe(before.money); // no admission without entrance
    });

    it('spawns exactly one visitor on tick 1 once entrance is placed (and charges admission)', () => {
      useGameStore.getState().startRun();

      // place entrance at edge
      useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });
      useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });

      const afterPlace = selectCore();
      expect(afterPlace.entrance).toEqual({ x: 0, y: 0 });

      const beforeTick = selectCore();
      const moneyBefore = beforeTick.money;

      useGameStore.getState().tickOnce(); // tick -> 1, spawn should happen

      const afterTick = selectCore();

      expect(afterTick.visitors.length).toBe(1);
      expect(afterTick.visitors[0].position).toEqual({ x: 1, y: 0 });

      // admission charged on spawn tick
      expect(afterTick.money).toBe(moneyBefore + ADMISSION_FEE);
    });

    it('charges admission on spawn tick, but does not apply per-tick spending until the next tick', () => {
      useGameStore.getState().startRun();

      // place entrance
      useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });
      useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });

      const before = selectCore();
      const money0 = before.money;

      // tick 1: spawn + admission, but no spending yet
      useGameStore.getState().tickOnce();
      const afterSpawn = selectCore();
      expect(afterSpawn.visitors.length).toBe(1);
      expect(afterSpawn.money).toBe(money0 + ADMISSION_FEE);

      // tick 2: visitor should now spend $1
      useGameStore.getState().tickOnce();
      const afterSpend = selectCore();

      // At minimum, money increased by spending for visitors that existed BEFORE tick 2 (1 visitor)
      // (If you also spawn on tick 2 for some reason, adjust expected.)
      expect(afterSpend.money).toBe(afterSpawn.money + 1 * MONEY_PER_VISITOR_PER_TICK);
    });

    it('spawned visitor moves on the next tick (deterministic movement)', () => {
      useGameStore.getState().startRun();

      // entrance at (0,0)
      useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkEntry' });
      useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });

      // tick 1 spawns
      useGameStore.getState().tickOnce();
      const afterSpawn = selectCore();
      const pos0 = afterSpawn.visitors[0].position;

      // tick 2 moves
      useGameStore.getState().tickOnce();
      const afterMove = selectCore();
      const pos1 = afterMove.visitors[0].position;

      // If your move can sometimes be "stay" due to collision or edge logic,
      // change this to match your expected snake step from (0,0).
      expect(pos1).not.toEqual(pos0);
    });
  });
});
