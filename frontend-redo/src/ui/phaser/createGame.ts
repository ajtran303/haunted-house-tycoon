import { BootScene } from './scenes/BootScene';

export type CreateGameArgs = {
  parent: HTMLElement;
};

// function responsible for creating the Phaser game instance
// this is the ONLY PLACE Phaser is imported at runtime
export const createGame = async ({ parent }: CreateGameArgs): Promise<Phaser.Game> => {
  const Phaser = await import('phaser');

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 600,
    scene: [BootScene],
  });
};
