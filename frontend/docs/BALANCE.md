# Balance

This document tracks all tunable constants and their intended effects. Update this as you playtest.

## How to Use This Doc

1. When tuning, note the old value and why you changed it
2. Playtest after changes
3. Document what felt right/wrong
4. Constants live in `src/core/constants.ts`

## Economy

### Starting Values

| Constant | Value | Purpose |
|----------|-------|---------|
| `STARTING_MONEY` | 500 | Initial cash. Should allow 2-3 rooms before needing income. |

### Spending

| Constant | Value | Purpose |
|----------|-------|---------|
| `BASE_SPEND_PER_TICK` | 1 | Baseline income per visitor per tick |
| `FEAR_SPEND_BOOST_START` | 20 | Fear level where bonus spending begins |
| `FEAR_SPEND_BOOST_CAP` | 80 | Fear level where bonus spending maxes out |
| `MAX_FEAR_BONUS_PER_TICK` | 3 | Maximum additional spending from fear |
| `HAPPY_SPEND_BOOST_START` | 60 | Happiness level where bonus begins |
| `MAX_HAPPY_BONUS_PER_TICK` | 2 | Maximum additional spending from happiness |
| `UNHAPPY_SPEND_STOP` | 20 | Happiness below this = no spending |

**Design intent:** Fear is the high-risk multiplier. Happiness is steady bonus. Both cap out to prevent infinite scaling.

### Upkeep

| Constant | Value | Purpose |
|----------|-------|---------|
| Room upkeep | varies | Per-room cost deducted each tick |
| `STAFF_UPKEEP_PER_TICK` | TBD | Per-staff cost (when implemented) |

**Design intent:** Upkeep creates pressure. Empty rooms drain money. Encourages active management.

### Bankruptcy

| Constant | Value | Purpose |
|----------|-------|---------|
| `BANKRUPTCY_WARNING_THRESHOLD` | TBD | Money level that triggers warning |
| Failure trigger | money ≤ 0 | Game ends |

**Tuning note:** Warning should give player 10-20 ticks to react. Currently triggers too late.

## Visitors

### Spawning

| Constant | Value | Purpose |
|----------|-------|---------|
| `TICKS_BETWEEN_SPAWNS` | 10 | How often new visitors appear |
| `MAX_VISITORS` | 50 | Population cap |

**Design intent:** Steady inflow. Cap prevents performance issues and creates natural pressure ceiling.

### Movement

| Constant | Value | Purpose |
|----------|-------|---------|
| Movement per tick | 1 tile | Visitors move one tile per tick |

### Intent

| Constant | Value | Purpose |
|----------|-------|---------|
| `DEFAULT_EXPLORE_TICKS_BEFORE_EXIT` | 50 | Ticks before visitor wants to leave |

**Design intent:** Visitors don't stay forever. Creates turnover and flow.

## Emotions

### Bounds

| Constant | Value | Purpose |
|----------|-------|---------|
| `EMOTION_BOUNDS.fear.min` | 0 | Can't go below zero |
| `EMOTION_BOUNDS.fear.max` | 100 | Can't exceed max |
| `EMOTION_BOUNDS.happiness.min` | 0 | Can't go below zero |
| `EMOTION_BOUNDS.happiness.max` | 100 | Can't exceed max |

### Starting Values

| Constant | Value | Purpose |
|----------|-------|---------|
| `VISITOR_START_FEAR` | 0 | Visitors arrive calm |
| `VISITOR_START_HAPPINESS` | 50 | Visitors arrive neutral |

### Decay & Recovery

| Constant | Value | Purpose |
|----------|-------|---------|
| `HAPPINESS_DECAY_PER_TICK` | 1 | Baseline happiness loss on midway |
| `FEAR_RECOVERY_PER_TICK` | 2 | Fear reduction on midway |

**Design intent:** Happiness decays everywhere creates pressure. Fear recovery on midway only makes it the safe zone.

### Thresholds

| Constant | Value | Purpose |
|----------|-------|---------|
| `FEAR_PANIC_THRESHOLD` | 90 | Fear at or above = panic exit |
| `HAPPINESS_MISERY_THRESHOLD` | 10 | Happiness at or below = misery exit |

**Design intent:** High thresholds mean deaths are preventable. Players see it coming.

## Room Effects

### Attraction Rooms

| Room | Fear | Happiness | Notes |
|------|------|-----------|-------|
| `entry` | 0 | +2 | Slight welcome boost |
| `hallway` | 0 | 0 | Neutral connector |
| `scare` | +8 | 0 | Primary fear generator |
| `exit` | 0 | 0 | Neutral |

### Stuck Decay (Attraction Only)

When visitor doesn't move inside attraction:

| Room | Happiness/tick |
|------|----------------|
| `entry` | -2 |
| `hallway` | -1 |
| `scare` | -1 |

**Design intent:** Congestion kills. Standing still in attractions drains happiness.

### Amenity Rooms (Midway Only)

| Room | Fear | Happiness | Spending | Notes |
|------|------|-----------|----------|-------|
| `foodStall` | TBD | TBD | TBD | First amenity type |

**Design intent:** Amenities counter baseline decay. Net positive on midway.

## Staff (When Implemented)

| Constant | Value | Purpose |
|----------|-------|---------|
| `STAFF_HIRE_COST` | TBD | One-time cost |
| `STAFF_UPKEEP_PER_TICK` | TBD | Ongoing cost |
| `STAFF_FEAR_BONUS_PER_SCARE` | TBD | Added fear per scare room entry |
| `STAFF_FEAR_CAP` | TBD | Max fear from staff bonus |
| `MAX_STAFF_PER_HAUNT` | TBD | Capacity limit |

**Design intent:** Staff amplify fear = amplify risk. More spending potential, more deaths.

## Balance Goals

### Fear vs Recovery Rate

```
Scare room fear: +8 per entry
Fear recovery: 2 per tick (midway only)

Ratio: One scare room takes 4 ticks to recover from
```

**Why:** Attractions should feel risky. Recovery should feel like relief, not instant reset.

### Income vs Upkeep

```
Base income: 1 per visitor per tick
Room upkeep: varies by room

Goal: 10-15 visitors to break even on a small park
```

### Session Length

```
Target: 10-20 minutes for a typical run
Fail fast if bad decisions
Reward good play with longer survival
```

## Tuning Log

Track changes here:

```
[Date] Changed X from Y to Z
Reason: ...
Result: ...
```

Example:
```
[2025-01-15] Changed HAPPINESS_DECAY_PER_TICK from 2 to 1
Reason: Visitors dying too fast, couldn't reach amenities
Result: Better pacing, deaths feel more earned
```
