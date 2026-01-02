import { DevPanel } from './ui/DevPanel';
import { FailScreen } from './ui/FailScreen';
import { Hud } from './ui/Hud';
import { PhaserHost } from './ui/phaser/PhaserHost';
import { TitleScreen } from './ui/TitleScreen';
import { TopBar } from './ui/TopBar';
import { Warnings } from './ui/Warnings';

// Game area width: ORIGIN_X (20) + grid (18 * 36 = 648) + margin (32) = 700px
const GAME_AREA_WIDTH = 700;

export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Main game area */}
      <div className="relative shrink-0" style={{ width: GAME_AREA_WIDTH }}>
        <TopBar />
        <Warnings />
        <PhaserHost />
        <FailScreen />
        <TitleScreen />
      </div>

      {/* Sidebar */}
      <Hud />

      {/* Dev tools overlay */}
      <DevPanel />
    </div>
  );
}
