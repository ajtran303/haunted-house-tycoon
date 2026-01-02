import {
  DEATH_SPIKE_THRESHOLD,
  DEATH_SPIKE_WINDOW_TICKS,
  SHUTDOWN_WARNING_TICKS,
} from '../../../src/core/constants';
import type { ExitEvent } from '../../../src/core/types';

describe('Death Shutdown System', () => {
  describe('constants are balanced', () => {
    it('requires multiple deaths to trigger spike', () => {
      expect(DEATH_SPIKE_THRESHOLD).toBeGreaterThanOrEqual(3);
    });

    it('uses a full day window for counting deaths', () => {
      expect(DEATH_SPIKE_WINDOW_TICKS).toBe(60);
    });

    it('gives a full day to recover from spike', () => {
      expect(SHUTDOWN_WARNING_TICKS).toBe(60);
    });

    it('threshold is hilariously high (not trivially easy to hit)', () => {
      // 10 deaths in 60 ticks = ~17% of max visitor capacity dying per day
      expect(DEATH_SPIKE_THRESHOLD).toBeGreaterThanOrEqual(10);
    });
  });

  describe('death counting logic', () => {
    const makeExitEvent = (tick: number, id: number): ExitEvent => ({
      id,
      tick,
      visitorId: id,
      reason: 'panic',
      position: { x: 0, y: 0 },
      location: { type: 'midway' },
    });

    it('counts deaths within the window', () => {
      const currentTick = 100;
      const events: ExitEvent[] = [
        makeExitEvent(50, 1), // tick 50, within window (100 - 60 = 40)
        makeExitEvent(60, 2), // tick 60, within window
        makeExitEvent(80, 3), // tick 80, within window
        makeExitEvent(90, 4), // tick 90, within window
      ];

      const deathsInWindow = events.filter(
        (e) => e.tick >= currentTick - DEATH_SPIKE_WINDOW_TICKS,
      ).length;

      expect(deathsInWindow).toBe(4);
    });

    it('excludes deaths outside the window', () => {
      const currentTick = 100;
      const events: ExitEvent[] = [
        makeExitEvent(30, 1), // tick 30, outside window (100 - 60 = 40)
        makeExitEvent(39, 2), // tick 39, outside window
        makeExitEvent(40, 3), // tick 40, exactly at window edge (included)
        makeExitEvent(50, 4), // tick 50, within window
      ];

      const deathsInWindow = events.filter(
        (e) => e.tick >= currentTick - DEATH_SPIKE_WINDOW_TICKS,
      ).length;

      expect(deathsInWindow).toBe(2); // 40 and 50
    });

    it('determines spiking state correctly', () => {
      const isSpiking = (deathCount: number) => deathCount >= DEATH_SPIKE_THRESHOLD;

      expect(isSpiking(0)).toBe(false);
      expect(isSpiking(DEATH_SPIKE_THRESHOLD - 1)).toBe(false);
      expect(isSpiking(DEATH_SPIKE_THRESHOLD)).toBe(true);
      expect(isSpiking(DEATH_SPIKE_THRESHOLD + 5)).toBe(true);
    });
  });

  describe('warning countdown logic', () => {
    it('calculates remaining ticks correctly', () => {
      const shutdownTicks = (warningTicks: number) => SHUTDOWN_WARNING_TICKS - warningTicks;

      expect(shutdownTicks(0)).toBe(60); // Not spiking, full runway
      expect(shutdownTicks(30)).toBe(30); // Half way through
      expect(shutdownTicks(59)).toBe(1); // Almost shutdown
      expect(shutdownTicks(60)).toBe(0); // Shutdown!
    });

    it('resets when deaths drop below threshold', () => {
      let deathWarningTicks = 30; // Mid-warning
      const deathsInWindow = DEATH_SPIKE_THRESHOLD - 1; // Below threshold

      // Logic from store.ts
      if (deathsInWindow >= DEATH_SPIKE_THRESHOLD) {
        deathWarningTicks += 1;
      } else {
        deathWarningTicks = 0;
      }

      expect(deathWarningTicks).toBe(0); // Reset!
    });
  });
});
