// tests/unit/ui/renderGrid.test.ts
import { useGameStore } from '../../../src/runtime/store';
import { createGridRenderer } from '../../../src/ui/phaser/render/renderGrid';

describe('createGridRenderer', () => {
  it('draws one rectangle per cell', () => {
    useGameStore.getState().newGame();
    const { grid } = useGameStore.getState();

    const rectApi = () => ({
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      disableInteractive: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setFillStyle: jest.fn().mockReturnThis(),
      setStrokeStyle: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      // Some Phaser objects expose this; safe no-op.
      getBounds: jest.fn(() => ({ width: 0, height: 0 })),
    });

    const textApi = () => ({
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      getBounds: jest.fn(() => ({ width: 0, height: 0 })),
      destroy: jest.fn(),
      visible: false,
    });

    const addRectangle = jest.fn(() => rectApi());
    const addText = jest.fn(() => textApi());

    const fakeScene = {
      add: {
        rectangle: addRectangle,
        text: addText,
      },
      scale: { width: 800, height: 600 },
      sys: { game: { config: { width: 800, height: 600 } } },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderer = createGridRenderer(fakeScene as any, grid, () => {});
    renderer.destroy();

    // +1 for the hover highlight rectangle
    const expected = grid.length * grid[0].length + 1;
    expect(addRectangle).toHaveBeenCalledTimes(expected);

    // 1 tooltip text object
    expect(addText).toHaveBeenCalledTimes(1);
  });
});
