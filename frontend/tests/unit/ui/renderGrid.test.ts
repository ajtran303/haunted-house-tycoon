// tests/unit/ui/renderGrid.test.ts
import { useGameStore } from '../../../src/runtime/store';
import { createGridRenderer } from '../../../src/ui/phaser/render/renderGrid';

describe('createGridRenderer', () => {
  it('draws one rectangle per cell', () => {
    useGameStore.getState().newGame();
    const { grid } = useGameStore.getState();

    const addRectangle = jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      disableInteractive: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setFillStyle: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    }));

    const fakeScene = {
      add: {
        rectangle: addRectangle,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderer = createGridRenderer(fakeScene as any, grid, () => {});
    renderer.destroy();

    const expected = grid.length * grid[0].length;
    expect(addRectangle).toHaveBeenCalledTimes(expected);
  });
});
