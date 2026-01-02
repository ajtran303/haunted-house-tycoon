/**
 * Fear Balance Verification
 *
 * Ensures fear gain in attractions outpaces fear recovery on midway,
 * maintaining meaningful risk. Attractions should feel dangerous,
 * midway should feel like relief.
 */

import {
  AMENITY_FEAR_REDUCTION,
  FEAR_PANIC_THRESHOLD,
  FEAR_RECOVERY_PER_TICK,
} from '../../../src/core/constants';
import { ROOM_EMOTION_EFFECTS } from '../../../src/core/visitors/roomEffects';

describe('Fear Balance', () => {
  const SCARE_FEAR_GAIN = ROOM_EMOTION_EFFECTS.scare?.fear ?? 0;

  it('scare room fear gain exceeds multiple ticks of midway recovery', () => {
    // One scare room should require multiple ticks to recover from
    const ticksToRecover = SCARE_FEAR_GAIN / FEAR_RECOVERY_PER_TICK;

    expect(ticksToRecover).toBeGreaterThanOrEqual(3);
    // Current: 6 / 2 = 3 ticks
  });

  it('visitor cannot fully recover from one scare room in 2 ticks or less', () => {
    const recoveryIn2Ticks = FEAR_RECOVERY_PER_TICK * 2;

    expect(SCARE_FEAR_GAIN).toBeGreaterThan(recoveryIn2Ticks);
    // Current: 6 > 4 ✓
  });

  it('multiple scare rooms create meaningful fear accumulation', () => {
    // A small attraction with 3 scare rooms should build significant fear
    const threeScareRooms = SCARE_FEAR_GAIN * 3;
    const ticksToRecover = threeScareRooms / FEAR_RECOVERY_PER_TICK;

    // Should require at least 8 ticks of midway time to recover
    expect(ticksToRecover).toBeGreaterThanOrEqual(8);
    // Current: 18 / 2 = 9 ticks ✓
  });

  it('panic requires multiple scare room visits', () => {
    // Panic should not be trivially easy - require several scare rooms
    const scareRoomsToHitPanic = Math.ceil(FEAR_PANIC_THRESHOLD / SCARE_FEAR_GAIN);

    expect(scareRoomsToHitPanic).toBeGreaterThanOrEqual(5);
    // Current: ceil(100 / 6) = 17 scare rooms from 0 fear
  });

  it('amenities provide meaningful but not instant fear relief', () => {
    // One amenity should not fully negate a scare room
    expect(AMENITY_FEAR_REDUCTION).toBeLessThan(SCARE_FEAR_GAIN);
    // Current: 5 < 6 ✓

    // But amenities should provide significant relief (at least half a scare room)
    expect(AMENITY_FEAR_REDUCTION).toBeGreaterThanOrEqual(SCARE_FEAR_GAIN / 2);
    // Current: 5 >= 3 ✓
  });

  it('fear recovery rate creates meaningful midway dwell time', () => {
    // Recovery rate should be slow enough that visitors need to spend
    // real time on midway to recover, but not so slow it feels stuck
    expect(FEAR_RECOVERY_PER_TICK).toBeGreaterThanOrEqual(1);
    expect(FEAR_RECOVERY_PER_TICK).toBeLessThanOrEqual(4);
    // Current: 2 (in the sweet spot)
  });
});
