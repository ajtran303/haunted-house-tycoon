import type { ExitEvent, Visitor } from '../core/types';

export type VisitorStats = {
  visitorCount: number;
  avgHappiness: number;
  avgFear: number;
  scaredCount: number;
};

export const computeVisitorStats = (visitors: Visitor[]): VisitorStats => {
  const count = visitors.length;

  if (count === 0) {
    return { visitorCount: 0, avgHappiness: 0, avgFear: 0, scaredCount: 0 };
  }

  let sumHappy = 0;
  let sumFear = 0;
  let scared = 0;
  for (const v of visitors) {
    sumHappy += v.happiness;
    sumFear += v.fear;
    if (v.fear > 0) scared += 1;
  }

  return {
    visitorCount: count,
    avgHappiness: Math.round(sumHappy / count),
    avgFear: Math.round(sumFear / count),
    scaredCount: scared,
  };
};

export type DeathStats = {
  panicCount: number;
  miseryCount: number;
  totalDeaths: number;
};

export const computeDeathStats = (exitEvents: ExitEvent[]): DeathStats => {
  let panicCount = 0;
  let miseryCount = 0;

  for (const e of exitEvents) {
    if (e.reason === 'panic') {
      panicCount += 1;
    } else if (e.reason === 'misery') {
      miseryCount += 1;
    }
  }

  return {
    panicCount,
    miseryCount,
    totalDeaths: panicCount + miseryCount,
  };
};
