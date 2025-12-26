# Game Design

This document captures the design philosophy, core loop, and intended player experience.

## Elevator Pitch

A park management game where you scare visitors for profit. Push too hard and they die. Don't push hard enough and you go broke.

## Core Fantasy

You run a haunted theme park. Visitors pay to be scared. Your job is to scare them _just enough_ - maximize spending without killing them. The park is a machine you build, and you watch it run.

## The Core Loop

```
BUILD → SCARE → PROFIT → EXPAND → (repeat)
           ↓
         DEATH → PRESSURE → ADAPT
```

1. **Build** attractions and place rooms
2. **Scare** visitors in attractions (fear = money)
3. **Profit** from scared-but-alive visitors
4. **Expand** with earnings
5. **Death** happens when you push too hard
6. **Pressure** mounts as things go wrong
7. **Adapt** or fail

## Two Zones, Two Purposes

The park has two fundamentally different spaces:

### Midway (Safety)

- Where visitors spawn and exit
- Fear _recovers_ here
- Happiness _decays_ here (baseline pressure)
- Amenities provide recovery
- Steady, low-risk income
- **Player goal:** Keep visitors healthy enough to survive attractions

### Attractions (Danger)

- Where fear is generated
- Scare rooms create fear
- No fear recovery
- Happiness decays when stuck (congestion kills)
- High-risk, high-reward income (fear bonus)
- **Player goal:** Scare without killing

### The Rhythm

Visitors cycle: Midway -> Attraction -> Midway -> Attraction -> ... -> Exit

This creates natural pacing. Danger, then relief. Risk, then recovery. The player's job is to tune this rhythm.

## Fear as a Resource

Fear is not purely bad. Fear is _money_.

- Low fear = low spending
- High fear = high spending
- Too much fear = death

The optimal strategy is not "minimize fear" or "maximize fear" but _manage fear_ - push visitors close to the edge without going over.

## Happiness as Flow

Happiness measures operational health, not visitor enjoyment.

- Happiness decays over time (on midway)
- Congestion accelerates decay (in attractions)
- Amenities restore happiness
- Low happiness = misery death

If visitors are dying of misery, the problem is _flow_ - they're stuck, congested, or denied recovery.

## Death is Information

When a visitor dies, the game is telling you something:

| Death Type | What It Means                                          |
| ---------- | ------------------------------------------------------ |
| Panic      | Too much fear. Fewer scare rooms, or more recovery.    |
| Misery     | Bad flow. Congestion, no amenities, or stuck visitors. |

Death should feel _earned_ - the player should understand what went wrong.

## Staff as Temptation

Staff amplify fear in attractions. This is a trap.

- More staff = more fear = more money
- More staff = more deaths = lost visitors
- Staff have upkeep = ongoing cost

Staff are not a solution. They're a risk multiplier. The player who over-hires will fail faster.

## Failure Modes

### Bankruptcy

Money hits zero. Most common failure.

**Causes:**

- Not enough visitors
- Too much upkeep
- Visitors dying before spending
- Spending not keeping up with costs

### Death Spiral

Deaths create pressure that causes more deaths.

**With tombstones (hardcore mode):**

- Deaths block tiles
- Blocked tiles cause congestion
- Congestion causes more deaths
- Attractions become "grinders"

## Design Principles

### Determinism Over Randomness

The simulation is deterministic. Same inputs = same outputs.

**Why:**

- Failure feels fair (you can trace what went wrong)
- Saves work reliably
- Testing is possible
- Replays are possible

### Cruelty is Readable

The game can be cruel, but never opaque.

- Deaths are visible
- Failure reasons are explained
- Pressure is observable (HUD, visitor states)
- No hidden mechanics

### Systems Over Content

The game is a simulation, not a story. Depth comes from interacting systems, not scripted content.

- Rooms have effects
- Effects combine
- Combinations create emergent outcomes

### Player Agency Through Layout

The primary player action is _building_. Layout decisions have consequences.

- Portal placement affects flow
- Attraction length affects fear accumulation
- Amenity placement affects recovery
- Exit path affects survival

There are no "undo" buttons. Choices matter.

## Intended Player Experience

### Early Game

- Learn the loop: build, watch, adjust
- First attraction is simple
- First deaths teach consequences
- Tutorial guides core actions

### Mid Game

- Multiple attractions
- Staff decisions
- Balancing fear vs recovery
- Expanding while maintaining

### Late Game

- Complex parks with many attractions
- Optimizing flow
- Managing staff across haunts
- Avoiding death spirals

### Failure

- Clear explanation of what went wrong
- Desire to try again with new knowledge
- "I should have..." feeling, not "that was unfair"

## What This Game Is Not

- **Not a horror game.** The player isn't scared; visitors are.
- **Not a story game.** No narrative, no characters, no plot.
- **Not a casual clicker.** Requires attention and adaptation.
- **Not a puzzle game.** No single "correct" solution.
- **Not a real-time strategy.** No combat, no enemies.

## Success Metrics

The game is working when:

- Players understand why they failed
- Players want to try again
- Different layouts create different outcomes
- Fear feels like a resource to manage
- Deaths feel earned, not random
- The simulation is interesting to watch

## Future Considerations

### Tombstones / Hardcore Mode

Deaths leave permanent obstacles. Creates escalating difficulty and spatial memory of failure.

### Visitor Types

Different archetypes (thrill seekers, easily scared) create asymmetric challenges.

### Scenarios

Preset challenges with modified rules (limited space, tough visitors, low cash).

### Events

Time-based disruptions (power outage, inspection) that test adaptability.
