import { useGameStore } from '../../../src/runtime/store';

describe('lifecycle state machine', () => {
  it('paused to running via startRun', () => {
    const { startRun } = useGameStore.getState();
    startRun();
    expect(useGameStore.getState().lifecycle).toBe('running');
  });

  it('running to paused via pause', () => {
    const store = useGameStore.getState();
    store.startRun();
    store.pause();
    expect(useGameStore.getState().lifecycle).toBe('paused');
  });

  it('paused to running via resume', () => {
    const store = useGameStore.getState();
    store.startRun();
    store.pause();
    store.resume();
    expect(useGameStore.getState().lifecycle).toBe('running');
  });

  it('cannot resume when failed', () => {
    const store = useGameStore.getState();
    store.fail();
    store.resume();
    expect(useGameStore.getState().lifecycle).toBe('failed');
  });

  it('cannot startRun from failed', () => {
    const store = useGameStore.getState();
    store.fail();
    store.startRun();
    expect(useGameStore.getState().lifecycle).toBe('failed');
  });

  it('invalid transition is a no-op', () => {
    const store = useGameStore.getState();
    store.fail();
    store.resume();
    expect(useGameStore.getState().lifecycle).toBe('failed');
  });
});
