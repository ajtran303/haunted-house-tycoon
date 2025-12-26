import {
  EMOTION_BOUNDS,
  FEAR_RECOVERY_PER_TICK,
  HAPPINESS_DECAY_PER_TICK,
} from '../../../../src/core/constants';
import {
  applyEmotionDelta,
  clampEmotion,
  decayHappiness,
  decayHappinessForVisitors,
  recoverFear,
  recoverFearForVisitors,
} from '../../../../src/core/visitors/emotions';
import { makeVisitor } from '../../../helpers/factories';

describe('clampEmotion', () => {
  it('returns value unchanged when within bounds', () => {
    expect(clampEmotion('fear', 10)).toBe(10);
    expect(clampEmotion('happiness', 50)).toBe(50);
  });

  it('clamps below min to min', () => {
    expect(clampEmotion('fear', EMOTION_BOUNDS.fear.min - 1)).toBe(EMOTION_BOUNDS.fear.min);
    expect(clampEmotion('happiness', EMOTION_BOUNDS.happiness.min - 999)).toBe(
      EMOTION_BOUNDS.happiness.min,
    );
  });

  it('clamps above max to max', () => {
    expect(clampEmotion('fear', EMOTION_BOUNDS.fear.max + 1)).toBe(EMOTION_BOUNDS.fear.max);
    expect(clampEmotion('happiness', EMOTION_BOUNDS.happiness.max + 999)).toBe(
      EMOTION_BOUNDS.happiness.max,
    );
  });

  it('uses per-stat bounds (future-proof)', () => {
    // This test is intentionally structured to fail if clampEmotion
    // accidentally uses a single shared min/max for both stats.
    expect(clampEmotion('fear', EMOTION_BOUNDS.fear.max + 100)).toBe(EMOTION_BOUNDS.fear.max);
    expect(clampEmotion('happiness', EMOTION_BOUNDS.happiness.max + 100)).toBe(
      EMOTION_BOUNDS.happiness.max,
    );
  });
});

describe('applyEmotionDelta', () => {
  it('returns a new visitor object (does not mutate input)', () => {
    const v = makeVisitor({ fear: 10, happiness: 20 });
    const next = applyEmotionDelta(v, { fear: 5, happiness: -5 });

    expect(next).not.toBe(v);
    // original unchanged
    expect(v.fear).toBe(10);
    expect(v.happiness).toBe(20);
  });

  it('adds deltas when provided', () => {
    const v = makeVisitor({ fear: 10, happiness: 20 });
    const next = applyEmotionDelta(v, { fear: 3, happiness: 7 });

    expect(next.fear).toBe(13);
    expect(next.happiness).toBe(27);
  });

  it('treats missing delta fields as 0', () => {
    const v = makeVisitor({ fear: 10, happiness: 20 });

    const nextFearOnly = applyEmotionDelta(v, { fear: 2 });
    expect(nextFearOnly.fear).toBe(12);
    expect(nextFearOnly.happiness).toBe(20);

    const nextHappyOnly = applyEmotionDelta(v, { happiness: -2 });
    expect(nextHappyOnly.fear).toBe(10);
    expect(nextHappyOnly.happiness).toBe(18);

    const nextNone = applyEmotionDelta(v, {});
    expect(nextNone.fear).toBe(10);
    expect(nextNone.happiness).toBe(20);
  });

  it('clamps results at min/max', () => {
    const vLow = makeVisitor({
      fear: EMOTION_BOUNDS.fear.min,
      happiness: EMOTION_BOUNDS.happiness.min,
    });

    const nextLow = applyEmotionDelta(vLow, { fear: -999, happiness: -999 });
    expect(nextLow.fear).toBe(EMOTION_BOUNDS.fear.min);
    expect(nextLow.happiness).toBe(EMOTION_BOUNDS.happiness.min);

    const vHigh = makeVisitor({
      fear: EMOTION_BOUNDS.fear.max,
      happiness: EMOTION_BOUNDS.happiness.max,
    });

    const nextHigh = applyEmotionDelta(vHigh, { fear: 999, happiness: 999 });
    expect(nextHigh.fear).toBe(EMOTION_BOUNDS.fear.max);
    expect(nextHigh.happiness).toBe(EMOTION_BOUNDS.happiness.max);
  });

  it('preserves unrelated visitor fields', () => {
    const v = makeVisitor({
      id: 42,
      position: { x: 3, y: 4 },
      prevPos: { x: 2, y: 4 },
      location: { type: 'attraction', attractionId: 'haunt1' },
      fear: 5,
      happiness: 5,
    });

    const next = applyEmotionDelta(v, { fear: 1, happiness: 1 });

    expect(next.id).toBe(42);
    expect(next.position).toEqual({ x: 3, y: 4 });
    expect(next.prevPos).toEqual({ x: 2, y: 4 });
    expect(next.location).toEqual({ type: 'attraction', attractionId: 'haunt1' });
  });
});

describe('happiness decay', () => {
  it('decays happiness by the default constant per tick', () => {
    const v = makeVisitor({ happiness: 50 });
    const next = decayHappiness(v);
    expect(next.happiness).toBe(50 - HAPPINESS_DECAY_PER_TICK);
  });

  it('applies to every visitor on midway', () => {
    const a = makeVisitor({ id: 1, location: { type: 'midway' }, happiness: 10 });
    const b = makeVisitor({ id: 2, location: { type: 'midway' }, happiness: 10 });
    const next = decayHappinessForVisitors([a, b]);
    expect(next[0].happiness).toBe(10 - HAPPINESS_DECAY_PER_TICK);
    expect(next[1].happiness).toBe(10 - HAPPINESS_DECAY_PER_TICK);
  });

  it('is tunable (supports overriding decay amount)', () => {
    const v = makeVisitor({ happiness: 10 });
    expect(decayHappiness(v, 3).happiness).toBe(7);
    expect(decayHappinessForVisitors([v], 5)[0].happiness).toBe(5);
  });

  it('cannot reduce happiness below the minimum clamp', () => {
    const v = makeVisitor({ happiness: EMOTION_BOUNDS.happiness.min });
    const next = decayHappiness(v, 999);
    expect(next.happiness).toBe(EMOTION_BOUNDS.happiness.min);
  });

  it('does not mutate the input visitor', () => {
    const v = makeVisitor({ happiness: 10 });
    const next = decayHappiness(v, 1);
    expect(next).not.toBe(v);
    expect(v.happiness).toBe(10);
  });

  it('does not decay happiness while a visitor is in an attraction', () => {
    const a = makeVisitor({ id: 1, location: { type: 'midway' }, happiness: 10 });
    const b = makeVisitor({
      id: 2,
      location: { type: 'attraction', attractionId: 'haunt1' },
      happiness: 10,
    });

    const next = decayHappinessForVisitors([a, b]);

    expect(next[0].happiness).toBe(10 - HAPPINESS_DECAY_PER_TICK);
    expect(next[1].happiness).toBe(10); // unchanged
  });
});

describe('fear recovery', () => {
  it('recovers fear by the default constant per tick on midway', () => {
    const v = makeVisitor({ fear: 50, location: { type: 'midway' } });
    const next = recoverFear(v);
    expect(next.fear).toBe(50 - FEAR_RECOVERY_PER_TICK);
  });

  it('applies to every visitor on midway', () => {
    const a = makeVisitor({ id: 1, location: { type: 'midway' }, fear: 30 });
    const b = makeVisitor({ id: 2, location: { type: 'midway' }, fear: 40 });
    const next = recoverFearForVisitors([a, b]);
    expect(next[0].fear).toBe(30 - FEAR_RECOVERY_PER_TICK);
    expect(next[1].fear).toBe(40 - FEAR_RECOVERY_PER_TICK);
  });

  it('is tunable (supports overriding recovery amount)', () => {
    const v = makeVisitor({ fear: 20, location: { type: 'midway' } });
    expect(recoverFear(v, 5).fear).toBe(15);
    expect(recoverFearForVisitors([v], 10)[0].fear).toBe(10);
  });

  it('cannot reduce fear below the minimum clamp', () => {
    const v = makeVisitor({ fear: EMOTION_BOUNDS.fear.min, location: { type: 'midway' } });
    const next = recoverFear(v, 999);
    expect(next.fear).toBe(EMOTION_BOUNDS.fear.min);
  });

  it('does not mutate the input visitor', () => {
    const v = makeVisitor({ fear: 30, location: { type: 'midway' } });
    const next = recoverFear(v, 5);
    expect(next).not.toBe(v);
    expect(v.fear).toBe(30);
  });

  it('does not recover fear while a visitor is in an attraction', () => {
    const a = makeVisitor({ id: 1, location: { type: 'midway' }, fear: 50 });
    const b = makeVisitor({
      id: 2,
      location: { type: 'attraction', attractionId: 'haunt1' },
      fear: 50,
    });

    const next = recoverFearForVisitors([a, b]);

    expect(next[0].fear).toBe(50 - FEAR_RECOVERY_PER_TICK);
    expect(next[1].fear).toBe(50); // unchanged - fear does not recover in attractions
  });

  it('returns same object when fear is already at minimum', () => {
    const v = makeVisitor({ fear: 0, location: { type: 'midway' } });
    const next = recoverFear(v);
    expect(next).toBe(v); // optimization: same reference when no change
  });
});
