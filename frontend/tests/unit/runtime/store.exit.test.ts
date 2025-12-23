/* eslint-disable @typescript-eslint/no-explicit-any */

import { useGameStore } from '../../../src/runtime/store';

describe('Exit placement + exit removal', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('does not allow placing exit when paused', () => {
    // paused by default
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkExit' as any });

    const before = useGameStore.getState();
    useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });

    const after = useGameStore.getState();

    expect(after.lifecycle).toBe('paused');
    expect((after as any).exit).toBeNull();
    expect(after.grid).toEqual(before.grid);
  });

  it('rejects exit placement when not on an edge', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkExit' as any });

    const before = useGameStore.getState();
    useGameStore.getState().dispatchInput({ type: 'clickCell', x: 2, y: 2 });

    const after = useGameStore.getState();

    expect((after as any).exit).toBeNull();
    expect(after.grid).toEqual(before.grid);
    expect(after.money).toBe(before.money);
    expect(after.nextRoomId).toBe(before.nextRoomId);
  });

  it('allows exit placement on an edge cell and stores exit position', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkExit' as any });

    useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });

    const after = useGameStore.getState();
    expect((after as any).exit).toEqual({ x: 0, y: 0 });
    expect((after.grid[0][0] as any).roomType).toBe('parkExit');
    expect(after.grid[0][0].occupied).toBe(true);
  });

  it('blocks placing a second exit (no-op)', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkExit' as any });

    useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });
    const mid = useGameStore.getState();
    expect((mid as any).exit).toEqual({ x: 0, y: 0 });

    const beforeSecond = useGameStore.getState();
    useGameStore.getState().dispatchInput({ type: 'clickCell', x: 4, y: 0 });

    const after = useGameStore.getState();
    expect((after as any).exit).toEqual({ x: 0, y: 0 });
    expect(after.money).toBe(beforeSecond.money);
    expect(after.nextRoomId).toBe(beforeSecond.nextRoomId);
    expect(after.grid).toEqual(beforeSecond.grid);
  });

  it('removes a visitor on the exit tile during tickOnce (main tick loop)', () => {
    useGameStore.setState({
      lifecycle: 'running',
      grid: [[{ type: 'empty', occupied: false, roomId: null, roomType: null }]],
      visitors: [{ id: 1, position: { x: 0, y: 0 }, prevPos: null, inAttraction: false }],
      nextVisitorId: 2,
      exit: { x: 0, y: 0 },
    } as any);

    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().visitors).toEqual([]);
  });
});
