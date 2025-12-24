import { EMOTION_BOUNDS } from '../../../../src/core/constants';
import type { Visitor } from '../../../../src/core/types';
import { applyEmotionDelta, clampEmotion } from '../../../../src/core/visitors/emotions';

const makeVisitor = (overrides?: Partial<Visitor>): Visitor => ({
  id: 1,
  position: { x: 0, y: 0 },
  prevPos: null,
  inAttraction: false,
  fear: 0,
  happiness: 50,
  ...overrides,
});

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
      inAttraction: true,
      fear: 5,
      happiness: 5,
    });

    const next = applyEmotionDelta(v, { fear: 1, happiness: 1 });

    expect(next.id).toBe(42);
    expect(next.position).toEqual({ x: 3, y: 4 });
    expect(next.prevPos).toEqual({ x: 2, y: 4 });
    expect(next.inAttraction).toBe(true);
  });
});
