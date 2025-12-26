import type { ExitEvent } from '../../../src/core/types';
import { computeDeathStats, computeVisitorStats } from '../../../src/runtime/selectors';
import { makeVisitor } from '../../helpers/factories';

describe('computeVisitorStats', () => {
  it('returns zeros for empty visitor list', () => {
    const result = computeVisitorStats([]);
    expect(result).toEqual({
      visitorCount: 0,
      avgHappiness: 0,
      avgFear: 0,
      scaredCount: 0,
    });
  });

  it('returns correct count for single visitor', () => {
    const visitors = [makeVisitor({ happiness: 50, fear: 10 })];
    const result = computeVisitorStats(visitors);
    expect(result.visitorCount).toBe(1);
  });

  it('calculates average happiness correctly', () => {
    const visitors = [
      makeVisitor({ id: 1, happiness: 40 }),
      makeVisitor({ id: 2, happiness: 60 }),
    ];
    const result = computeVisitorStats(visitors);
    expect(result.avgHappiness).toBe(50);
  });

  it('calculates average fear correctly', () => {
    const visitors = [
      makeVisitor({ id: 1, fear: 20 }),
      makeVisitor({ id: 2, fear: 40 }),
    ];
    const result = computeVisitorStats(visitors);
    expect(result.avgFear).toBe(30);
  });

  it('rounds averages to nearest integer', () => {
    const visitors = [
      makeVisitor({ id: 1, happiness: 33 }),
      makeVisitor({ id: 2, happiness: 33 }),
      makeVisitor({ id: 3, happiness: 34 }),
    ];
    const result = computeVisitorStats(visitors);
    expect(result.avgHappiness).toBe(33); // 100/3 = 33.33... rounds to 33
  });

  it('counts scared visitors (fear > 0)', () => {
    const visitors = [
      makeVisitor({ id: 1, fear: 0 }),
      makeVisitor({ id: 2, fear: 1 }),
      makeVisitor({ id: 3, fear: 50 }),
      makeVisitor({ id: 4, fear: 0 }),
    ];
    const result = computeVisitorStats(visitors);
    expect(result.scaredCount).toBe(2);
  });

  it('handles single visitor correctly', () => {
    const visitors = [makeVisitor({ happiness: 75, fear: 25 })];
    const result = computeVisitorStats(visitors);
    expect(result).toEqual({
      visitorCount: 1,
      avgHappiness: 75,
      avgFear: 25,
      scaredCount: 1,
    });
  });
});

describe('computeDeathStats', () => {
  const makeExitEvent = (overrides: Partial<ExitEvent>): ExitEvent => ({
    id: 1,
    tick: 100,
    visitorId: 1,
    reason: 'panic',
    position: { x: 0, y: 0 },
    location: { type: 'midway' },
    ...overrides,
  });

  it('returns zeros for empty event list', () => {
    const result = computeDeathStats([]);
    expect(result).toEqual({
      panicCount: 0,
      miseryCount: 0,
      totalDeaths: 0,
    });
  });

  it('counts panic deaths correctly', () => {
    const events = [
      makeExitEvent({ id: 1, reason: 'panic' }),
      makeExitEvent({ id: 2, reason: 'panic' }),
    ];
    const result = computeDeathStats(events);
    expect(result.panicCount).toBe(2);
    expect(result.miseryCount).toBe(0);
    expect(result.totalDeaths).toBe(2);
  });

  it('counts misery deaths correctly', () => {
    const events = [
      makeExitEvent({ id: 1, reason: 'misery' }),
      makeExitEvent({ id: 2, reason: 'misery' }),
      makeExitEvent({ id: 3, reason: 'misery' }),
    ];
    const result = computeDeathStats(events);
    expect(result.panicCount).toBe(0);
    expect(result.miseryCount).toBe(3);
    expect(result.totalDeaths).toBe(3);
  });

  it('counts mixed death types correctly', () => {
    const events = [
      makeExitEvent({ id: 1, reason: 'panic' }),
      makeExitEvent({ id: 2, reason: 'misery' }),
      makeExitEvent({ id: 3, reason: 'panic' }),
      makeExitEvent({ id: 4, reason: 'misery' }),
      makeExitEvent({ id: 5, reason: 'panic' }),
    ];
    const result = computeDeathStats(events);
    expect(result.panicCount).toBe(3);
    expect(result.miseryCount).toBe(2);
    expect(result.totalDeaths).toBe(5);
  });
});
