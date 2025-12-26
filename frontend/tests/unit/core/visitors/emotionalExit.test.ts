import { FEAR_PANIC_THRESHOLD, HAPPINESS_MISERY_THRESHOLD } from '../../../../src/core/constants';
import type { Visitor } from '../../../../src/core/types';
import { getEmotionalExitReason } from '../../../../src/core/visitors/emotionalExit';

const makeVisitor = (overrides?: Partial<Visitor>): Visitor => ({
  id: 1,
  position: { x: 0, y: 0 },
  prevPos: null,
  location: { type: 'midway' },
  returnPortalPos: null,
  fear: 0,
  happiness: 50,
  intent: 'explore',
  spawnTick: 0,
  exploreStartTick: 0,
  ...overrides,
});

describe('getEmotionalExitReason', () => {
  it('returns panic when fear exceeds threshold', () => {
    expect(getEmotionalExitReason(makeVisitor({ fear: FEAR_PANIC_THRESHOLD + 1 }))).toBe('panic');
  });

  it('returns misery when happiness drops below threshold', () => {
    expect(getEmotionalExitReason(makeVisitor({ happiness: HAPPINESS_MISERY_THRESHOLD - 1 }))).toBe(
      'misery',
    );
  });

  it('returns null when within bounds', () => {
    expect(getEmotionalExitReason(makeVisitor())).toBe(null);
  });
});
