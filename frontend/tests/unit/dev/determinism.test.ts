import { runDeterminismScript } from '../../../src/dev/determinismScript';

describe('Determinism script', () => {
  it('produces identical final snapshot + hash across runs', () => {
    const a = runDeterminismScript();
    const b = runDeterminismScript();
    const c = runDeterminismScript();

    expect(b.snapshot).toEqual(a.snapshot);
    expect(c.snapshot).toEqual(a.snapshot);

    expect(b.hash).toBe(a.hash);
    expect(c.hash).toBe(a.hash);
  });
});
