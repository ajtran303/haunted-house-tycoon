export type ConsumeTicksResult = {
  ticksToProcess: number;
  remainderMs: number;
};

type ConsumeTicksArgs = {
  accumulatedMs: number;
  deltaMs: number;
  msPerTick: number;
};

// given last accumulated ms and new frame delta, compute:
// - how many whole ticks should run
// - how many ms remain unconsumed
export const consumeTicks = (args: ConsumeTicksArgs): ConsumeTicksResult => {
  const { accumulatedMs, deltaMs, msPerTick } = args;

  if (msPerTick <= 0) throw new Error('msPerTick must be > 0');
  if (deltaMs < 0) throw new Error('deltaMs must be >= 0');
  if (accumulatedMs < 0) throw new Error('accumulatedMs must be >=0');

  const total = accumulatedMs + deltaMs;
  const ticksToProcess = Math.floor(total / msPerTick);
  const remainderMs = total - ticksToProcess * msPerTick;

  return { ticksToProcess, remainderMs };
};
