import { FEAR_PANIC_THRESHOLD, HAPPINESS_MISERY_THRESHOLD } from '../../../../src/core/constants';
import { getEmotionalExitReason } from '../../../../src/core/visitors/emotionalExit';
import { makeVisitor } from '../../../helpers/factories';

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
