import type { Visitor } from '../../../src/core/types';
import { applyIntentRules, EXIT_AFTER_TICKS } from '../../../src/core/visitors/applyIntentRules';

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
    ...overrides,
  }) as Visitor;

describe('applyIntentRules', () => {
  it('does nothing when no exit exists', () => {
    const visitors = [
      v({ id: 1, spawnTick: 0, intent: 'explore' }),
      v({ id: 2, spawnTick: 0, intent: 'exit' }),
    ];

    const actual = applyIntentRules(visitors, 999, null);

    expect(actual).toEqual(visitors);
  });

  it('keeps explore intent before threshold', () => {
    const visitors = [v({ spawnTick: 10, intent: 'explore' })];
    const tick = 10 + EXIT_AFTER_TICKS - 1;

    const actual = applyIntentRules(visitors, tick, { x: 5, y: 5 });

    expect(actual[0].intent).toBe('explore');
  });

  it('switches explore -> exit at threshold when exit exists', () => {
    const visitors = [v({ spawnTick: 10, intent: 'explore' })];
    const tick = 10 + EXIT_AFTER_TICKS;

    const actual = applyIntentRules(visitors, tick, { x: 5, y: 5 });

    expect(actual[0].intent).toBe('exit');
  });

  it('does not change non-explore intents', () => {
    const visitors = [v({ id: 1, spawnTick: 0, intent: 'exit' })];

    const actual = applyIntentRules(visitors, 999, { x: 1, y: 1 });

    expect(actual[0].intent).toBe('exit');
  });

  it('is deterministic: same inputs -> same outputs', () => {
    const visitors = [
      v({ id: 1, spawnTick: 0, intent: 'explore' }),
      v({ id: 2, spawnTick: 100, intent: 'explore' }),
      v({ id: 3, spawnTick: 0, intent: 'exit' }),
    ];

    const tick = 1000;
    const exit = { x: 9, y: 9 };

    const a = applyIntentRules(visitors, tick, exit);
    const b = applyIntentRules(visitors, tick, exit);

    expect(a).toEqual(b);
  });

  it('only changes the visitors that cross the rule boundary', () => {
    const visitors = [
      v({ id: 1, spawnTick: 0, intent: 'explore' }),
      v({ id: 2, spawnTick: 999, intent: 'explore' }),
    ];

    const tick = EXIT_AFTER_TICKS; // visitor 1 crosses, visitor 2 does not

    const actual = applyIntentRules(visitors, tick, { x: 1, y: 1 });

    expect(actual.find((x) => x.id === 1)?.intent).toBe('exit');
    expect(actual.find((x) => x.id === 2)?.intent).toBe('explore');
  });
});
