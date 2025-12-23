import { shouldSpawnFakeVisitor } from '../../../src/core/visitorsFake';

describe('shouldSpawnFakeVisitor', () => {
  it('does not spawn at tick 0', () => {
    expect(shouldSpawnFakeVisitor(0)).toBe(false);
  });

  it('spawns exactly on multiples of the interval', () => {
    expect(shouldSpawnFakeVisitor(5)).toBe(true);
    expect(shouldSpawnFakeVisitor(10)).toBe(true);
  });

  it('does not spawn on non-multiples', () => {
    expect(shouldSpawnFakeVisitor(1)).toBe(false);
    expect(shouldSpawnFakeVisitor(6)).toBe(false);
  });
});
