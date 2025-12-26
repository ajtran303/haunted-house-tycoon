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
5. Place amenities on the midway to boost happiness
6. Don't go bankrupt

**Two Zones:**

- **Midway** - Safe zone. Visitors recover from fear and spend steady income. Happiness decays here but amenities help.
- **Attractions** - Danger zone. Scare rooms generate fear. High fear = high spending, but too much = panic death.

**Win Condition:** Stay profitable.

**Lose Condition:** Money hits zero.

## Current Features

- **Deterministic Simulation** - Same inputs = same outputs. Reproducible runs, testable logic.
- **Two-Grid System** - Midway hub with multiple attraction sub-grids connected via portals.
- **Visitor Emotions** - Fear and happiness drive spending and exits.
- **Amenities** - Recovery rooms on the midway that counter happiness decay.
- **Warnings** - Toast notifications for low money, high fear, death spikes.
- **Death Tracking** - TopBar shows cumulative deaths by type (panic/misery).

## Controls

- **Click** - Place rooms, interact with UI
- **Hover** - View room info, visitor emotions
- **Speed Controls** - Pause, normal (1x), fast (4x)

## Dev Mode

When `DEV_MODE` is enabled in `src/dev/devMode.ts`:

**Dev Panel (bottom-left):**

- +$1000, Spawn Visitors, Clear Park
- Auto Entry/Exit setup
- Template Haunt creation
- Show Visitor Intent toggle

**Console Commands:**

- `__gameState()` - Get full store state
- `__tick()` - Advance one tick (works while paused)
- `__bootScene` - Access Phaser scene

**Additional:**

- 10x speed button
- Scared count in fear bar

## Tech Stack

- **Vite + React + TypeScript** - Frontend framework
- **Phaser 3** - Game rendering
- **Zustand** - State management
- **Jest** - Testing
- **Tailwind CSS** - Styling

## Project Structure

```
src/
├── core/           # Pure game logic (no rendering)
│   ├── visitors/   # Movement, emotions, spending
│   ├── economy.ts  # Money calculations
│   └── types.ts    # Type definitions
├── runtime/        # State management (Zustand store)
│   ├── store.ts    # Actions and state
│   └── selectors.ts # Derived state helpers
├── ui/             # React components
│   └── phaser/     # Phaser scenes and renderers
├── dev/            # Dev mode utilities
└── docs/           # Feature documentation
```

## Design Principles

- **Logic-first** - Core simulation is pure functions, testable without UI
- **Determinism** - No hidden randomness. Seeded RNG where variation is needed.
- **Cruelty is readable** - Failure is intentional, but never opaque
- **No magic** - Visitors don't teleport. State changes are explicit.

## Roadmap

**Current: Alpha**

- Core loop complete
- Two-grid system with portals
- Visitor emotions and spending
- Amenities
- Dev tooling

**Next: Beta**

- Staff system (hire scarers to amplify fear)
- Room demolition
- Save/load
- Tutorial

**Future: Post-Beta**

- Game modes (Normal vs Hardcore)
- Advanced visitor types
- Day/night cycle
- Events and incidents
- Visual and audio polish

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

```

## Documentation

- [Game Design](./docs/GAME_DESIGN.md) - Design philosophy
- [Balance](./docs/BALANCE.md) - Economy tuning
- [Contributing](./docs/CONTRIBUTING.md) - Dev setup and conventions
- [Staff](./docs/STAFF.md) - Staff feature spec
- [Demolition](./docs/DEMOLITION.md) - Demolition feature spec

## License

MIT
