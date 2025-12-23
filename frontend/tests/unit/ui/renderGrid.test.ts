// tests/unit/ui/renderGrid.test.ts
import { useGameStore } from '../../../src/runtime/store';
import { renderGrid } from '../../../src/ui/phaser/render/renderGrid';

describe('renderGrid', () => {
  it('draws one rectangle per cell', () => {
    useGameStore.getState().newGame();

    const addRectangle = jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setStrokeStyle: jest.fn().mockReturnThis(),
    }));

    const fakeScene = {
      add: {
        rectangle: addRectangle,
      },
    };

    renderGrid(fakeScene);

    const { grid } = useGameStore.getState();
    const expected = grid.length * grid[0].length;

    expect(addRectangle).toHaveBeenCalledTimes(expected);
  });
});
