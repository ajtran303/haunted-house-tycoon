// IMPORTANT: do not import Phaser here.
// Importing Phaser in Jest/jsdom will crash due to missing Canvas features.

export class BootScene {
  // Phaser accepts a "key" string for scene identification.
  // (Using a static property avoids needing Phaser.Scene typing.)
  static key = 'boot';

  // Phaser will call create() when the scene starts.
  // At runtime (in the browser), `this` will be a Phaser.Scene instance.
  create() {
    // Use `any` here intentionally to avoid importing Phaser types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as any;

    self.add.text(20, 20, 'Phaser OK', {
      fontSize: '20px',
      color: '#ffffff',
    });
  }
}
