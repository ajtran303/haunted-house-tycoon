import type { Visitor } from '../types';
import type { Vector } from '../types';
import { exitStep } from './exitStep';
import { randomWalkStep } from './randomWalkStep';

type ChooseArgs = {
  w: number;
  h: number;
  pos: Vector;
  visitor: Visitor;
  tick: number;
  exit: Vector | null;
  isBlocked: (p: Vector) => boolean;
  isWalkable: (p: Vector) => boolean;
};

export const chooseStepForVisitor = (args: ChooseArgs): Vector => {
  const { visitor, exit } = args;

  switch (visitor.intent) {
    case 'exit':
      if (exit) return exitStep(args);
      return randomWalkStep({ ...args, visitorId: visitor.id });

    case 'explore':
    default:
      return randomWalkStep({ ...args, visitorId: visitor.id });
  }
};
