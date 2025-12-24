// Import React hooks needed for lifecycle management and persistent mutable refs
// Import Phaser *types only* so no Phaser code executes at runtime during import
// This avoids triggering Canvas/WebGL setup in environments like Jest
import type Phaser from 'phaser';
import { useEffect, useRef } from 'react';

// Import the function responsible for creating the Phaser.Game instance
// This keeps Phaser creation outside the React component itself
import { createGame } from './createGame';

// React component whose sole responsibility is to host Phaser inside React
export const PhaserHost = () => {
  // Ref to the DOM element that Phaser will mount its <canvas> into
  // This ref persists across renders without causing re-renders
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Ref to store the Phaser.Game instance once it is created
  // Using a ref avoids recreating the game on re-render
  const gameRef = useRef<Phaser.Game | null>(null);

  // useEffect runs after the component is mounted and the DOM is available
  // This is where it is safe to create the Phaser game
  useEffect(() => {
    // Flag used to detect whether the component has been unmounted
    // before the async game creation finishes
    let cancelled = false;

    // Guard clause:
    // - If the container DOM node does not exist yet, do nothing
    // - If a game already exists, do nothing
    //
    // This prevents:
    // - duplicate game creation
    // - React StrictMode double-effect behavior
    // - hot reload stacking canvases
    if (!containerRef.current || gameRef.current) return;

    // Immediately invoked async function to allow use of await
    // without making the effect itself async
    (async () => {
      // Create the Phaser game and mount it into the container element
      const game = await createGame({ parent: containerRef.current! });

      // If the component was unmounted while the game was being created,
      // destroy the game immediately to avoid leaks
      if (cancelled) {
        game.destroy(true);
        return;
      }

      // Store the game instance so it can be managed across the component lifecycle
      gameRef.current = game as Phaser.Game;
    })();

    // Cleanup function runs when:
    // - the component unmounts
    // - React re-runs the effect (e.g. hot module replacement)
    return () => {
      // Mark the effect as cancelled so in-flight async work can self-abort
      cancelled = true;

      // Destroy the Phaser game instance if it exists
      // `true` removes the canvas and unregisters all event listeners
      gameRef.current?.destroy(true);

      // Clear the reference so a future mount can recreate the game cleanly
      gameRef.current = null;
    };
  }, []); // Empty dependency array ensures this effect runs once per mount

  // Render a single div that serves as the mounting point for Phaser
  // Phaser will inject its <canvas> element inside this container
  return <div data-testid="phaser-root" ref={containerRef} />;
};
