/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Vector } from '../../../../src/core/types';
import type { Visitor } from '../../../../src/core/types';

jest.mock('../../../../src/core/visitors/randomWalkStep', () => ({
  randomWalkStep: jest.fn(),
}));

jest.mock('../../../../src/core/visitors/exitStep', () => ({
  exitStep: jest.fn(),
}));

import { chooseStepForVisitor } from '../../../../src/core/visitors/chooseStepForVisitor';
import { exitStep } from '../../../../src/core/visitors/exitStep';
import { randomWalkStep } from '../../../../src/core/visitors/randomWalkStep';

const RW = randomWalkStep as unknown as jest.Mock;
const EX = exitStep as unknown as jest.Mock;

const baseArgs = (overrides?: Partial<Parameters<typeof chooseStepForVisitor>[0]>) => {
  const visitor: Visitor = {
    // include only required fields your Visitor type needs; add defaults as needed
    id: 1,
    pos: { x: 1, y: 1 },
    intent: 'explore',
    spawnTick: 0,
    ...(overrides?.visitor as any),
  };

  return {
    w: 5,
    h: 5,
    pos: visitor.position,
    visitor,
    tick: 10,
    exit: { x: 4, y: 4 } as Vector,
    isBlocked: (_p: Vector) => false,
    isWalkable: (_p: Vector) => true,
    ...overrides,
  };
};

describe('chooseStepForVisitor', () => {
  beforeEach(() => {
    RW.mockReset();
    EX.mockReset();
  });

  it('uses randomWalkStep when intent is explore', () => {
    RW.mockReturnValue({ x: 9, y: 9 });
    EX.mockReturnValue({ x: 8, y: 8 });

    const args = baseArgs({ visitor: { intent: 'explore' } as any });
    const out = chooseStepForVisitor(args);

    expect(RW).toHaveBeenCalledTimes(1);
    expect(EX).not.toHaveBeenCalled();
    expect(out).toEqual({ x: 9, y: 9 });

    // ensure visitorId was forwarded
    const callArg = RW.mock.calls[0][0];
    expect(callArg.visitorId).toBe(args.visitor.id);
  });

  it('uses exitStep when intent is exit and exit exists', () => {
    RW.mockReturnValue({ x: 9, y: 9 });
    EX.mockReturnValue({ x: 2, y: 2 });

    const args = baseArgs({ visitor: { intent: 'exit' } as any, exit: { x: 4, y: 4 } });
    const out = chooseStepForVisitor(args);

    expect(EX).toHaveBeenCalledTimes(1);
    expect(RW).not.toHaveBeenCalled();
    expect(out).toEqual({ x: 2, y: 2 });
  });

  it('falls back to randomWalkStep when intent is exit but exit is null', () => {
    RW.mockReturnValue({ x: 7, y: 7 });
    EX.mockReturnValue({ x: 2, y: 2 });

    const args = baseArgs({ visitor: { intent: 'exit' } as any, exit: null });
    const out = chooseStepForVisitor(args);

    expect(RW).toHaveBeenCalledTimes(1);
    expect(EX).not.toHaveBeenCalled();
    expect(out).toEqual({ x: 7, y: 7 });

    const callArg = RW.mock.calls[0][0];
    expect(callArg.visitorId).toBe(args.visitor.id);
  });
});
