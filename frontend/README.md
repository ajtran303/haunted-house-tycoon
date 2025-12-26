# Haunted House Tycoon

A deterministic park management game where you balance fear and profit. Build haunted attractions that scare visitors for money, but push too hard and they'll panic, leave, or worse.

## Play the Game

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## How to Play

**The Loop:**

1. Build a park entrance and exit on the midway
2. Create haunted attractions with scare rooms
3. Connect attractions to the midway via portals
4. Visitors enter, get scared, and spend money
5. Place amenities on the midway to keep visitors happy
6. Hire staff to amplify fear (and risk)
7. Don't go bankrupt

**Two Zones:**

- **Midway** - Safe zone. Visitors recover from fear and spend steady income. Happiness decays here but can be recovered by visiting amenities.
- **Attractions** - Danger zone. Scare rooms generate fear. High fear = high spending, but too much = panic death.

**Win Condition:** Stay profitable.

**Lose Condition:** Money hits zero.

## Features

- **Deterministic Simulation** - Same inputs = same outputs. Reproducible runs, testable logic.
- **Two-Grid System** - Midway hub with multiple attraction sub-grids connected via portals.
- **Visitor Emotions** - Fear and happiness drive spending and exits.
- **Staff as Risk Amplifiers** - Hire scarers to boost fear output. More staff = more money, more deaths.
- **Amenities** - Recovery rooms on the midway that counter happiness decay.
- **Queue Pressure** - Congestion at portals creates visible queues and cascading failures.
- **Save/Load** - Deterministic persistence. Quit and resume without state corruption.

## Controls

- **Click** - Place rooms, interact with UI
- **Hover** - View room info, visitor emotions
- **Speed Controls** - Pause, normal (1x), fast (4x)

## Tech Stack

- **Vite + React + TypeScript** - Frontend framework
- **Phaser 3** - Game rendering
- **Zustand** - State management
- **Vitest** - Testing

## Project Structure

```
src/
├── core/           # Pure game logic (no rendering)
│   ├── visitors/   # Movement, emotions, spending
│   ├── economy.ts  # Money calculations
│   └── types.ts    # Type definitions
├── runtime/        # State management (Zustand store)
├── ui/             # React components, Phaser scenes
└── tests/          # Unit tests
```

## Design Principles

- **Logic-first** - Core simulation is pure functions, testable without UI
- **Determinism** - No hidden randomness. Seeded RNG where variation is needed.
- **Cruelty is readable** - Failure is intentional, but never opaque
- **No magic** - Visitors don't teleport. State changes are explicit.

## Roadmap

**Current: Beta**

- Core loop complete
- Staff system
- Amenities and fear recovery
- Save/load
- Tutorial

**Next: Hardcore Mode (Tombstones)**

- Visitors who die leave permanent tombstones
- Tombstones block construction and movement
- Attractions can become "grinders" (enter but can't exit)
- Death spirals reshape the map
- Optional toggle at game start

**Future:**

- Advanced visitor types (thrill seekers, easily scared, impatient)
- Scenario modes
- Events and random incidents
- Cloud save
- Visual and audio polish

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Build for production
npm run build
```

## License

MIT
