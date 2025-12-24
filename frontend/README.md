<!-- TOC start (generated with https://github.com/derlin/bitdowntoc) -->

- [Haunted House Tycoon (Frontend)](#haunted-house-tycoon-frontend)
  - [Overview](#overview)
  - [Core Design Principles](#core-design-principles)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Install dependencies](#install-dependencies)
    - [Run the game in development](#run-the-game-in-development)
    - [Run tests](#run-tests)
    - [Run determinism checks](#run-determinism-checks)
  - [How the Game Works (High Level)](#how-the-game-works-high-level)
  - [Project Structure](#project-structure)
  - [Key Files to Read First](#key-files-to-read-first)
  - [Contributing](#contributing)
    - [Feature Dev Tips](#feature-dev-tips)
    - [Adding Features (example)](#adding-features-example)
  - [Current Limitations](#current-limitations)
  - [Project Status](#project-status)
  - [License](#license)

<!-- TOC end -->

<!-- TOC --><a name="haunted-house-tycoon-frontend"></a>

# Haunted House Tycoon (Frontend)

A deterministic management simulation game focused on system trustworthiness, explicit lifecycle control, and emergent failure through player decisions.

This project prioritizes correctness and determinism over early polish or content. All outcomes are driven by transparent simulation rules rather than scripted events or hidden systems.

<!-- TOC --><a name="overview"></a>

## Overview

Haunted House Tycoon is a tycoon-style simulation where the player builds and manages a haunted house while time advances and visitors move through the space.

The core design goal is to ensure that:

- All game outcomes are explainable
- All state changes are deterministic
- Failure emerges from systems interacting, not tutorials or safety nets

There is no save/load system, onboarding tutorial, or difficulty scaling layer at this stage. The game can be started, played, and lost in a single uninterrupted session.

<!-- TOC --><a name="core-design-principles"></a>

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

<!-- TOC --><a name="tech-stack"></a>

## Tech Stack

- React + TypeScript — UI and application structure
- Vite — development and build tooling
- Zustand — centralized game state and actions
- Phaser — grid and visitor rendering
- Jest — unit testing
- Node.js — local development environment

<!-- TOC --><a name="getting-started"></a>

## Getting Started

<!-- TOC --><a name="prerequisites"></a>

### Prerequisites

- Node.js (18+ recommended)
- npm

<!-- TOC --><a name="install-dependencies"></a>

### Install dependencies

```bash
npm install
```

<!-- TOC --><a name="run-the-game-in-development"></a>

### Run the game in development

```bash
npm run dev
```

<!-- TOC --><a name="run-tests"></a>

### Run tests

```bash
npm test
```

<!-- TOC --><a name="run-determinism-checks"></a>

### Run determinism checks

```bash
npm run determinism
```

<!-- TOC --><a name="how-the-game-works-high-level"></a>

## How the Game Works (High Level)

- **React** renders the HUD and hosts the Phaser canvas.
- **Phaser** renders the grid and visitors and runs a frame loop.
- **Zustand** holds all game state and exposes actions.
- Simulation ticks advance time and apply rules.
- UI and rendering react to state changes; they do not own logic.
- All meaningful state changes occur through explicit actions or during a simulation tick.

<!-- TOC --><a name="project-structure"></a>

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
    └── core/      # Pure function unit tests
    └── runtime/   # Store and lifecycle unit tests
```

<!-- TOC --><a name="key-files-to-read-first"></a>

## Key Files to Read First

1. `src/runtime/store.ts`
   - Defines all game state and actions.
2. `src/ui/phaser/scenes/BootScene.ts`
   - Drives the simulation tick loop and rendering subscriptions.
3. `tests/unit/runtime/`
   - Shows expected behavior for lifecycle, ticking, speed, and failure.

<!-- TOC --><a name="contributing"></a>

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

<!-- TOC --><a name="feature-dev-tips"></a>

### Feature Dev Tips

If a ticket says “add a new ability/system,” you’ll usually:

1. add state to GameState (in src/core/types)
2. add an action here
3. call that action from UI or from inside tickOnce
4. add tests (can be done first or last)

If you add a new room type with special behavior, it likely needs:

1. placement validation rules in src/core/placement
2. simulation effects in src/core/visitors/\* or tickOnce
3. rendering behavior in Phaser
4. and possibly special store fields (like entrance/exit)

<!-- TOC --><a name="adding-features-example"></a>

### Adding Features (example)

> “Add a ‘Staff’ system that increases visitor fear but costs upkeep”

1. Add state
   - Add fields in GameState (in src/core/types), e.g. staffCount, staffWagesPerTick
2. Add actions
   - Add hireStaff() / fireStaff() actions in store.ts (guarded by lifecycle as needed)
3. Hook into the tick
   - In tickOnce, after upkeep (or before), subtract wages
   - Or modify emotion decay / emotional exit thresholds using staffCount
4. Render & UI
   - Add HUD display + buttons
   - Keep rules in core/store, not UI
5. Test
   - Add unit tests that assert:
     - wages reduce money per tick
     - staff affects emotional exits or fear gain deterministically

<!-- TOC --><a name="current-limitations"></a>

## Current Limitations

- No save/load system
- No tutorial or onboarding flow
- No accessibility or input rebinding layer
- Balance and content are intentionally minimal

These are deliberate omissions during the current development phase.

<!-- TOC --><a name="project-status"></a>

## Project Status

This project is in active development and is currently focused on:

- Simulation correctness
- Explicit lifecycle handling
- Safe restarts
- Deterministic behavior across speeds
- Content expansion and polish are deferred until system trustworthiness is proven.

<!-- TOC --><a name="license"></a>

## License

MIT License
