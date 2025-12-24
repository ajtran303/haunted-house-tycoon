import { FEAR_PANIC_THRESHOLD, HAPPINESS_MISERY_THRESHOLD } from '../constants';
import type { ExitEvent, ExitReason, Visitor } from '../types';

export const getEmotionalExitReason = (v: Visitor): ExitReason | null => {
  if (v.fear > FEAR_PANIC_THRESHOLD) return 'panic';
  if (v.happiness < HAPPINESS_MISERY_THRESHOLD) return 'misery';
  return null;
};

export const removeVisitorsByEmotionalExit = (
  visitors: Visitor[],
  tick: number,
  nextEventId: number,
): {
  remaining: Visitor[];
  events: ExitEvent[];
  nextEventId: number;
} => {
  const remaining: Visitor[] = [];
  const events: ExitEvent[] = [];
  let id = nextEventId;

  for (const v of visitors) {
    const reason = getEmotionalExitReason(v);
    if (!reason) {
      remaining.push(v);
      continue;
    }

    events.push({
      id,
      tick,
      visitorId: v.id,
      reason,
      position: v.position,
    });

    id += 1;
  }

  return { remaining, events, nextEventId: id };
};
