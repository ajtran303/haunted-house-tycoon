import { BootScene } from './scenes/BootScene';

export type CreateGameArgs = {
  parent: HTMLElement;
};

// function responsible for creating the Phaser game instance
// this is the ONLY PLACE Phaser is imported at runtime
export const createGame = async ({ parent }: CreateGameArgs): Promise<Phaser.Game> => {
  const Phaser = await import('phaser');

  // Canvas size: fits midway grid with margins
  // Width: ORIGIN_X (20) + grid (18 * 36) + margin = 700
  // Height: ORIGIN_Y (160) + grid (12 * 36) + margin = 650
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 700,
    height: 650,
    scene: [BootScene],
  });
};
