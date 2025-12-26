# Visitor Movement System

How visitors navigate the park, enter attractions, and find their way to the exit.

## Overview

Visitors move one tile per tick across two types of grids: the **midway** (main park area) and **attractions** (individual haunted houses). Movement is deterministic - same inputs produce same outputs - but uses seeded hashing to create varied, natural-looking behavior.

## Movement Flow

```
[Visitor at position]
        │
        ▼
[Blocked state recovery?]
  ├─ queued-to-enter → retry portal entry
  ├─ queued-to-return → retry midway return
  └─ null → proceed
        │
        ▼
[Choose next position]
  ├─ In attraction → randomWalkStep (prefer exit)
  └─ On midway → based on intent
       ├─ explore → randomWalkStep
       └─ exit → exitStep (pathfind)
        │
        ▼
[Portal transition?]
  ├─ Success → move to attraction entry
  ├─ Blocked → queue-to-enter, stay
  └─ No portal → continue
        │
        ▼
[Attraction exit?]
  ├─ Success → move to midway
  ├─ Blocked → queue-to-return, stay
  └─ No exit → continue
        │
        ▼
[Normal movement]
  ├─ Trapped? → set blocking state
  └─ Move to position
```

## Key Concepts

### Intent System

Visitors have one of two intents:

| Intent    | Behavior                                     | Trigger                 |
| --------- | -------------------------------------------- | ----------------------- |
| `explore` | Random walk on midway, can enter attractions | Spawn, attraction exit  |
| `exit`    | Pathfind to park exit                        | After N ticks exploring |

Intent only affects midway behavior. Inside attractions, visitors always walk toward the exit.

**Timing:** After `DEFAULT_EXPLORE_TICKS_BEFORE_EXIT` (30) ticks on the midway, explore → exit.

### Blocking States

Spatial constraints that pause normal movement:

| State              | Location          | Cause                     | Resolution             |
| ------------------ | ----------------- | ------------------------- | ---------------------- |
| `queued-to-enter`  | Portal tile       | Attraction entry occupied | Auto-retry next tick   |
| `queued-to-return` | Attraction exit   | No valid midway position  | Auto-retry next tick   |
| `trapped`          | Inside attraction | No valid moves            | Stays until path opens |

Blocking states are invisible to players. They represent physical constraints, not visitor decisions.

### Occupancy

A global occupancy map prevents two visitors from occupying the same tile. The map is keyed by `location + position`, so midway (3,4) and attraction-A (3,4) are different slots.

Occupancy is rebuilt each tick before movement. As visitors move, they free up positions for others.

## Two-Grid System

### Midway

The main park area. Visitors:

- Spawn at park entrance
- Walk on floor tiles and amenity tiles
- Cannot walk on hallway/scare tiles (attraction-only)
- Can step onto portal tiles to enter attractions

### Attractions

Individual haunted house grids. Visitors:

- Enter via portal → appear at attraction's entry point
- Walk on: entry, hallway, scare, exit tiles
- Cannot walk on empty tiles
- Exit via exit tile → return to midway near portal

## Portal Transitions

### Entering an Attraction

Triggered when visitor steps onto `attractionPortal` tile.

**Requirements:**

1. Attraction has entry AND exit tiles placed
2. Entry point not occupied

**On success:**

- Position → attraction's entryPoint
- Location → `{ type: 'attraction', attractionId }`
- Stores `returnPortalPos` (midway position to return to)
- Intent → 'explore'
- `exploreStartTick` resets

**On blocked:** State → `queued-to-enter`, stays on portal tile.

### Exiting an Attraction

Triggered when visitor reaches attraction's exit tile.

**Return position search:**

1. Check tiles adjacent to stored `returnPortalPos` (distance 1)
2. Check tiles at distance 2
3. Must be floor type, not occupied, not special tiles

**On success:**

- Position → found return position
- Location → `{ type: 'midway' }`
- `returnPortalPos` cleared

**On blocked:** State → `queued-to-return`, stays at exit tile.

## Step Selection

### Random Walk (`randomWalkStep`)

Used for exploration (midway and attractions).

1. Get preferred direction from `preferredDir()` (seeded by visitor ID + tick bucket)
2. Try directions in counter-clockwise order from preferred
3. First pass: only "preferred" moves (toward exit in attractions)
4. Second pass: any valid move
5. Fallback: stay in place

### Exit Pathfinding (`exitStep`)

Used when intent is 'exit' on midway.

1. Get all valid neighbor tiles (4-directional)
2. Calculate Manhattan distance to exit for each
3. Return neighbor closest to exit
4. Ties broken by preferred direction

### Preferred Direction

Deterministic pseudo-random direction selection.

**How it works:**

```ts
preferredDir(visitorId, tick) {
  bucket = floor(tick / 5)
  hash = hash32(visitorId * 1000003 + bucket) // large prime number
  return hash % 4  // 0=up, 1=right, 2=down, 3=left
};
```

1. Bucket the tick by 5 (direction changes every 5 ticks, not every tick)
2. Combine visitor ID and bucket into a single seed: `visitorId * 1000003 + bucket`
3. Hash the seed with `hash32()` to get a well-distributed integer
4. Modulo 4 to get direction

**The hash32 function:**

```ts
hash32(n) {
  let x = n | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
};
```

A 32-bit integer mixing function that scrambles input bits to produce uniform output distribution. Uses XOR shifts and multiplication by magic constants (similar to [MurmurHash](https://en.wikipedia.org/wiki/MurmurHash)). Same input always produces same output, but small input changes produce wildly different outputs.

This creates varied movement without actual randomness. Different visitors move differently, but the same visitor at the same tick always picks the same direction.

## Walkability Rules

### On Midway

Can walk on:

- Floor tiles
- Amenity tiles (foodStall, giftShop, etc.)
- Portal tiles (triggers entry)
- Park entry/exit tiles

Cannot walk on:

- Empty tiles
- Hallway/scare tiles (attraction-only)
- Occupied tiles

### In Attractions

Can walk on:

- Entry tile
- Hallway tiles
- Scare tiles
- Exit tile (triggers return)

Cannot walk on:

- Empty tiles
- Any other room type
- Occupied tiles

## Game Loop Integration

In `store.ts` tickOnce():

```
1. applyIntentRules()     → Update intents based on time
2. moveVisitorsMultiGrid() → All movement logic
3. applyRoomEmotionEffects() → Fear/happiness on entry
4. decayHappiness()        → Midway decay
5. recoverFear()           → Midway recovery
6. removeVisitorsByEmotionalExit() → Panic/misery deaths
7. Despawn at exit         → Normal exit
```

## Key Files

| File                       | Purpose                                |
| -------------------------- | -------------------------------------- |
| `moveVisitorsMultiGrid.ts` | Main movement orchestrator             |
| `chooseStepForVisitor.ts`  | Midway step selection by intent        |
| `randomWalkStep.ts`        | Random walk with preferences           |
| `exitStep.ts`              | Pathfinding to exit                    |
| `applyIntentRules.ts`      | Intent state transitions               |
| `preferredDir.ts`          | Deterministic direction selection      |
| `dirs.ts`                  | Direction utilities (deltas, rotation) |

## Design Notes

**Why deterministic?** Reproducible runs enable debugging, testing, and potential replay features. Seeded hashing provides variety without true randomness.

**Why separate grids?** Attractions are self-contained spaces. Portal transitions are explicit state changes, not just walking between tiles. This enables attractions with different sizes and layouts.

**Why implicit queuing?** No explicit queue data structure. Blocking states + automatic retry + occupancy naturally creates queue behavior. Visitors waiting at a portal appear to queue without queue management code.

**Why preference-based movement?** Pure random walks look jittery. Preferring a direction for ~5 ticks creates smoother paths. The counter-clockwise rotation ensures visitors don't get stuck when preferred direction is blocked.
