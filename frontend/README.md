# Haunted House Tycoon (Frontend)

A deterministic management simulation game focused on system trustworthiness, explicit lifecycle control, and emergent failure through player decisions.

This project prioritizes correctness and determinism over early polish or content. All outcomes are driven by transparent simulation rules rather than scripted events or hidden systems.

## Overview

Haunted House Tycoon is a tycoon-style simulation where the player builds and manages a haunted house while time advances and visitors move through the space.

The core design goal is to ensure that:

- All game outcomes are explainable
- All state changes are deterministic
- Failure emerges from systems interacting, not tutorials or safety nets

There is no save/load system, onboarding tutorial, or difficulty scaling layer at this stage. The game can be started, played, and lost in a single uninterrupted session.

## Core Design Principles

- Deterministic simulation
    - Given the same inputs, the game will always produce the same results.
- Single source of truth
    - All game state lives in a centralized store.
- Tick-driven systems
    - Time advances in discrete simulation ticks.
- No “explanation-only” systems
    - Every system must affect time, money, or visitors.
- Failure is allowed
    - The player can ignore problems and lose naturally.

## Tech Stack

- React + TypeScript — UI and application structure
- Vite — development and build tooling
- Zustand — centralized game state and actions
- Phaser — grid and visitor rendering
- Jest — unit testing
- Node.js — local development environment

## Getting Started
### Prerequisites

- Node.js (18+ recommended)
- npm

### Install dependencies
```bash
npm install
```

### Run the game in development
```bash
npm run dev
```

### Run tests
```bash
npm test
```

### Run determinism checks
```bash
npm run determinism
```

## How the Game Works (High Level)

- **React** renders the HUD and hosts the Phaser canvas.
- **Phaser** renders the grid and visitors and runs a frame loop.
- **Zustand** holds all game state and exposes actions.
- Simulation ticks advance time and apply rules.
- UI and rendering react to state changes; they do not own logic.
- All meaningful state changes occur through explicit actions or during a simulation tick.

## Project Structure
```txt
src/
├── core/           # Pure-ish simulation rules (economy, grid, visitors, time)
├── runtime/        # Game state, lifecycle, and actions (Zustand store)
├── ui/
│   ├── phaser/     # Phaser scenes, renderers, and subscriptions
│   └── react/      # HUD and React UI components
├── dev/            # Development and verification scripts
└── main.tsx        # Application entry point

tests/
└── unit/
    └── runtime/   # Store and lifecycle unit tests
```

## Key Files to Read First

1. `src/runtime/store.ts`
    - Defines all game state and actions.
2. `src/ui/phaser/scenes/BootScene.ts`
    - Drives the simulation tick loop and rendering subscriptions.
3. `tests/unit/runtime/`
    - Shows expected behavior for lifecycle, ticking, speed, and failure.

## Contributing

1. Identify what state changes (money, time, visitors, grid).
2. Add or extend core logic in src/core if it’s a rule.
3. Wire behavior through store actions in runtime/store.ts.
4. Update rendering or UI as needed.
5. Add or update unit tests.
6. Run determinism checks if simulation behavior changed.

As a rule:

- Rendering should never be the source of truth.
- Simulation logic should be testable without Phaser.

## Current Limitations

- No save/load system
- No tutorial or onboarding flow
- No accessibility or input rebinding layer
- Balance and content are intentionally minimal

These are deliberate omissions during the current development phase.

## Project Status

This project is in active development and is currently focused on:

- Simulation correctness
- Explicit lifecycle handling
- Safe restarts
- Deterministic behavior across speeds
- Content expansion and polish are deferred until system trustworthiness is proven.

## License

MIT License
