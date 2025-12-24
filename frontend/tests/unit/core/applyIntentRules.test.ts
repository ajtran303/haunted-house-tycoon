import { DEFAULT_EXPLORE_TICKS_BEFORE_EXIT } from '../../../src/core/constants';
import type { Visitor } from '../../../src/core/types';
import { applyIntentRules } from '../../../src/core/visitors/applyIntentRules';

const v = (overrides: Partial<Visitor> = {}): Visitor =>
  ({
    id: 1,
    position: { x: 0, y: 0 },
    prevPos: null,
    inAttraction: false,
    fear: 0,
    happiness: 60,
    intent: 'explore',
    spawnTick: 0,
    exploreStartTick: 0,
    ...overrides,
  }) as Visitor;

describe('applyIntentRules', () => {
  it('does nothing when no park exit exists', () => {
    const visitors = [
      v({ id: 1, exploreStartTick: 0, intent: 'explore' }),
      v({ id: 2, exploreStartTick: 0, intent: 'exit' }),
    ];

    const actual = applyIntentRules(visitors, 999, null);

    expect(actual).toEqual(visitors);
  });

  it('keeps explore intent before threshold', () => {
    const visitors = [v({ exploreStartTick: 10, intent: 'explore' })];
    const tick = 10 + DEFAULT_EXPLORE_TICKS_BEFORE_EXIT - 1;

    const actual = applyIntentRules(visitors, tick, { x: 5, y: 5 });

    expect(actual[0].intent).toBe('explore');
  });

  it('switches explore -> exit at threshold when park exit exists', () => {
    const visitors = [v({ exploreStartTick: 10, intent: 'explore' })];
    const tick = 10 + DEFAULT_EXPLORE_TICKS_BEFORE_EXIT;

    const actual = applyIntentRules(visitors, tick, { x: 5, y: 5 });

    expect(actual[0].intent).toBe('exit');
  });

  it('does not change non-explore intents', () => {
    const visitors = [v({ id: 1, exploreStartTick: 0, intent: 'exit' })];

    const actual = applyIntentRules(visitors, 999, { x: 1, y: 1 });

    expect(actual[0].intent).toBe('exit');
  });

  it('is deterministic: same inputs -> same outputs', () => {
    const visitors = [
      v({ id: 1, exploreStartTick: 0, intent: 'explore' }),
      v({ id: 2, exploreStartTick: 100, intent: 'explore' }),
      v({ id: 3, exploreStartTick: 0, intent: 'exit' }),
    ];

    const tick = 1000;
    const exit = { x: 9, y: 9 };

    const a = applyIntentRules(visitors, tick, exit);
    const b = applyIntentRules(visitors, tick, exit);

    expect(a).toEqual(b);
  });

  it('only changes the visitors that cross the rule boundary', () => {
    const visitors = [
      v({ id: 1, exploreStartTick: 0, intent: 'explore' }),
      v({ id: 2, exploreStartTick: 999, intent: 'explore' }),
    ];

    const tick = DEFAULT_EXPLORE_TICKS_BEFORE_EXIT; // visitor 1 crosses, visitor 2 does not

    const actual = applyIntentRules(visitors, tick, { x: 1, y: 1 });

    expect(actual.find((x) => x.id === 1)?.intent).toBe('exit');
    expect(actual.find((x) => x.id === 2)?.intent).toBe('explore');
  });

  it('intent changes based on per-visitor age (exploreStartTick), not global tick', () => {
    const exit = { x: 9, y: 9 };
    const tick = 60;

    const visitors = [
      v({ id: 1, exploreStartTick: 0, intent: 'explore' }),
      v({ id: 2, exploreStartTick: 50, intent: 'explore' }),
    ];

    const out = applyIntentRules(visitors, tick, exit);

    expect(out.find((vv) => vv.id === 1)!.intent).toBe('exit'); // age 60
    expect(out.find((vv) => vv.id === 2)!.intent).toBe('explore'); // age 10
  });

  it('does not change intent while inAttraction (timer paused)', () => {
    const visitors = [v({ inAttraction: true, intent: 'explore', exploreStartTick: 0 })];

    const tick = 0 + DEFAULT_EXPLORE_TICKS_BEFORE_EXIT;
    const out = applyIntentRules(visitors, tick, { x: 1, y: 1 });

    expect(out[0].intent).toBe('explore'); // still explore
  });
});
