import { shouldSpawnVisitor } from '../../../src/core/shouldSpawnVisitor';

describe('shouldSpawnVisitor', () => {
  it('does not spawn at tick 0', () => {
    expect(shouldSpawnVisitor(0)).toBe(false);
  });

  it('spawns exactly on multiples of the interval', () => {
    expect(shouldSpawnVisitor(5)).toBe(true);
    expect(shouldSpawnVisitor(10)).toBe(true);
  });

  it('spawns on tick 1', () => {
    expect(shouldSpawnVisitor(1)).toBe(true);
  });

  it('does not spawn on non-multiples', () => {
    expect(shouldSpawnVisitor(6)).toBe(false);
  });
});
