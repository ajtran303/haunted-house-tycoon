# Haunted House Tycoon

Haunted House Tycoon is a management simulation focused on building and operating a haunted attraction through player-driven decisions.

The project emphasizes predictable systems, clear cause-and-effect, and simulation behavior that can be reasoned about, rather than hidden rules or opaque outcomes.

## Overview

In Haunted House Tycoon, players design and manage a haunted house by placing rooms, guiding visitor flow, and balancing fear, happiness, and income.

The simulation is designed so that outcomes emerge from explicit rules and player actions, not from scripted events or hidden adjustments. When failure occurs, it should be understandable based on the visible state of the system.

## Design Principles

- Deterministic simulation
- Explicit time progression
- Clear cause → effect relationships
- No hidden or background state changes
- Systems favor clarity over realism

All core mechanics are intended to be inspectable and testable.

## Technology

- Vite + React + TypeScript
- Phaser for rendering
- Zustand for state management
- ESLint + Prettier
- Jest for testing

The codebase is organized to keep simulation logic separate from rendering and UI concerns.

## Project Structure

```
src/
├── core/       # simulation logic
├── runtime/    # lifecycle and orchestration
├── ui/         # rendering and UI
├── App.tsx
└── main.tsx

tests/
├── unit/
├── integration/
└── helpers/
```

## Philosophy

Haunted House Tycoon is built around the idea that simulation games are more engaging when players can understand what happened and why.

The goal is to create a system where success and failure feel earned, predictable, and debuggable through the game’s own mechanics.
