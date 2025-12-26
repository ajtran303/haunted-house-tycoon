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
    expect(after.midwayGrid).toEqual(before.midwayGrid);
  });

  it('rejects exit placement when not on an edge', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkExit' as any });

    const before = useGameStore.getState();
    useGameStore.getState().dispatchInput({ type: 'clickCell', x: 2, y: 2 });

    const after = useGameStore.getState();

    expect((after as any).exit).toBeNull();
    expect(after.midwayGrid).toEqual(before.midwayGrid);
    expect(after.money).toBe(before.money);
    expect(after.nextRoomId).toBe(before.nextRoomId);
  });

  it('allows exit placement on an edge cell and stores exit position', () => {
    useGameStore.getState().startRun();
    useGameStore.getState().dispatchInput({ type: 'selectRoomType', roomType: 'parkExit' as any });

    useGameStore.getState().dispatchInput({ type: 'clickCell', x: 0, y: 0 });

    const after = useGameStore.getState();
    expect((after as any).exit).toEqual({ x: 0, y: 0 });
    expect((after.midwayGrid[0][0] as any).roomType).toBe('parkExit');
    expect(after.midwayGrid[0][0].occupied).toBe(true);
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
    expect(after.midwayGrid).toEqual(beforeSecond.midwayGrid);
  });

  it('removes a visitor on the exit tile during tickOnce (main tick loop)', () => {
    useGameStore.setState({
      lifecycle: 'running',
      midwayGrid: [[{ type: 'empty', occupied: false, roomId: null, roomType: null }]],
      visitors: [
        {
          id: 1,
          position: { x: 0, y: 0 },
          prevPos: null,
          location: { type: 'midway' },
          returnPortalPos: null,
        },
      ],
      nextVisitorId: 2,
      exit: { x: 0, y: 0 },
    } as any);

    useGameStore.getState().tickOnce();

    expect(useGameStore.getState().visitors).toEqual([]);
  });
});
