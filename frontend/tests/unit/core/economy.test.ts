import { upkeepPerTick } from '../../../src/core/economy';
import { newGame } from '../../../src/core/newGame';

describe('economy upkeepPerTick', () => {
  it('is 0 for an empty grid', () => {
    const s = newGame();
    expect(upkeepPerTick(s.midwayGrid)).toBe(0);
  });

  it('charges per room tile deterministically', () => {
    const s = newGame();

    // Mark 1 hallway tile and 2 scare tiles (adjust to your grid helpers if you have them)
    s.midwayGrid[0][0] = {
      ...s.midwayGrid[0][0],
      occupied: true,
      roomType: 'hallway',
      roomId: 'h-1',
    };
    s.midwayGrid[0][1] = {
      ...s.midwayGrid[0][1],
      occupied: true,
      roomType: 'scare',
      roomId: 's-1',
    };
    s.midwayGrid[0][2] = {
      ...s.midwayGrid[0][2],
      occupied: true,
      roomType: 'scare',
      roomId: 's-2',
    };

    expect(upkeepPerTick(s.midwayGrid)).toBe(1 * 1 + 2 * 2);
  });
});
