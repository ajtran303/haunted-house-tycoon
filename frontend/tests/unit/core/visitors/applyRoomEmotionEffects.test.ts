// src/core/visitors/applyRoomEmotionEffects.test.ts
import { EMOTION_BOUNDS } from '../../../../src/core/constants';
import type { Grid, Visitor } from '../../../../src/core/types';
import { applyRoomEmotionEffects } from '../../../../src/core/visitors/applyRoomEmotionEffects';

const makeVisitor = (overrides?: Partial<Visitor>): Visitor => ({
  id: 1,
  position: { x: 1, y: 1 },
  prevPos: { x: 0, y: 1 }, // default: "entered"
  inAttraction: false,
  fear: 0,
  happiness: 50,
  intent: 'explore',
  spawnTick: 0,
  exploreStartTick: 0,
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeGrid = (roomTypeAtCenter: any): Grid => {
  // Minimal grid with a roomType at (1,1)
  const emptyCell = { type: 'floor', occupied: false, roomId: null, roomType: null };
  const cell = { ...emptyCell, occupied: true, roomId: 'r1', roomType: roomTypeAtCenter };
  return [
    [emptyCell, emptyCell, emptyCell],
    [emptyCell, cell, emptyCell],
    [emptyCell, emptyCell, emptyCell],
  ] as unknown as Grid;
};

describe('applyRoomEmotionEffects', () => {
  it('Entry gives a small happiness boost on entry', () => {
    const grid = makeGrid('entry');
    const v = makeVisitor({ happiness: 10, fear: 0 });
    const [next] = applyRoomEmotionEffects([v], grid);

    expect(next.happiness).toBe(12); // matches mapping (+2)
    expect(next.fear).toBe(0);
  });

  it('Hallway is neutral on entry', () => {
    const grid = makeGrid('hallway');
    const v = makeVisitor({ happiness: 10, fear: 5 });
    const [next] = applyRoomEmotionEffects([v], grid);

    expect(next.happiness).toBe(10);
    expect(next.fear).toBe(5);
  });

  it('Scare increases fear and does not affect happiness on entry', () => {
    const grid = makeGrid('scare');
    const v = makeVisitor({ happiness: 10, fear: 5 });
    const [next] = applyRoomEmotionEffects([v], grid);

    expect(next.fear).toBe(13); // +8
    expect(next.happiness).toBe(10);
  });

  it('Does not trigger if visitor did not enter a new cell', () => {
    const grid = makeGrid('scare');
    const v = makeVisitor({
      prevPos: { x: 1, y: 1 }, // no movement -> no entry
      position: { x: 1, y: 1 },
      happiness: 10,
      fear: 5,
    });
    const [next] = applyRoomEmotionEffects([v], grid);

    expect(next.fear).toBe(5);
    expect(next.happiness).toBe(10);
  });

  it('Clamps results via applyEmotionDelta', () => {
    const grid = makeGrid('scare');
    const v = makeVisitor({
      fear: EMOTION_BOUNDS.fear.max,
      happiness: EMOTION_BOUNDS.happiness.min,
    });
    const [next] = applyRoomEmotionEffects([v], grid);

    expect(next.fear).toBe(EMOTION_BOUNDS.fear.max);
    expect(next.happiness).toBe(EMOTION_BOUNDS.happiness.min);
  });
});
