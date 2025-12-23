import { ADMISSION_FEE } from '../../../src/core/constants';
import { shouldSpawnFakeVisitor } from '../../../src/core/visitorsFake';
import { useGameStore } from '../../../src/runtime/store';

describe('shouldSpawnFakeVisitor', () => {
  it('does not spawn at tick 0', () => {
    expect(shouldSpawnFakeVisitor(0)).toBe(false);
  });

  it('spawns exactly on multiples of the interval', () => {
    expect(shouldSpawnFakeVisitor(5)).toBe(true);
    expect(shouldSpawnFakeVisitor(10)).toBe(true);
  });

  it('spawns on tick 1', () => {
    expect(shouldSpawnFakeVisitor(1)).toBe(true);
  });

  it('does not spawn on non-multiples', () => {
    expect(shouldSpawnFakeVisitor(6)).toBe(false);
  });
});
