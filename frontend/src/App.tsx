import { Hud } from './ui/Hud';
import { PhaserHost } from './ui/phaser/PhaserHost';
import { TopBar } from './ui/TopBar';
import { Warnings } from './ui/Warnings';

export default function App() {
  return (
    <>
      <TopBar />
      <Warnings />
      <Hud />
      <PhaserHost />
    </>
  );
}
