import { render } from '@testing-library/react';

import * as createGameModule from '../../src/ui/phaser/createGame';
import { PhaserHost } from '../../src/ui/phaser/PhaserHost';

describe('PhaserHost', () => {
  it('creates and destroys the Phaser game exactly once', async () => {
    const destroy = jest.fn();

    jest
      .spyOn(createGameModule, 'createGame')
      .mockResolvedValue({ destroy } as unknown as import('phaser').Game);

    const { unmount } = render(<PhaserHost />);

    await Promise.resolve();

    expect(createGameModule.createGame).toHaveBeenCalledTimes(1);

    unmount();

    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
