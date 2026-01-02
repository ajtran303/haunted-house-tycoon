# Balance

This document tracks all tunable constants and their intended effects. Update this as you playtest.

## How to Use This Doc

1. When tuning, note the old value and why you changed it
2. Playtest after changes
3. Document what felt right/wrong
4. Constants live in `src/core/constants.ts`

## Economy

### Starting Values

| Constant         | Value | Purpose                                                             |
| ---------------- | ----- | ------------------------------------------------------------------- |
| `STARTING_MONEY` | 1500  | Initial cash. Enough for one small attraction + comfortable runway. |
| `ADMISSION_FEE`  | 10    | One-time fee when visitor enters park                               |

### Spending

| Constant                   | Value | Purpose                                    |
| -------------------------- | ----- | ------------------------------------------ |
| `BASE_SPEND_PER_TICK`      | 1     | Baseline income per visitor per tick       |
| `FEAR_SPEND_BOOST_START`   | 20    | Fear level where bonus spending begins     |
| `FEAR_SPEND_BOOST_CAP`     | 80    | Fear level where bonus spending maxes out  |
| `MAX_FEAR_BONUS_PER_TICK`  | 4     | Maximum additional spending from fear      |
| `HAPPY_SPEND_BOOST_START`  | 60    | Happiness level where bonus begins         |
| `MAX_HAPPY_BONUS_PER_TICK` | 6     | Maximum additional spending from happiness |
| `UNHAPPY_SPEND_STOP`       | 10    | Happiness below this = no spending         |

**Design intent:** Fear is the high-risk multiplier. Happiness is steady bonus. Max spend = $11/tick (1 + 4 + 6).

### Upkeep

| Room       | Cost/tick | Notes                                       |
| ---------- | --------- | ------------------------------------------- |
| hallway    | 1         | Small drain, incentivizes efficient layouts |
| scare      | 2         | Higher drain, risk/reward tradeoff          |
| entry/exit | 0         | Required rooms, no ongoing cost             |
| amenities  | 0         | Cost to build, passive benefit              |

| Staff     | Cost/tick | Notes              |
| --------- | --------- | ------------------ |
| Per staff | 1         | Ongoing wage drain |

### Bankruptcy Warning

| Constant                          | Value | Purpose                               |
| --------------------------------- | ----- | ------------------------------------- |
| `BANKRUPTCY_WARNING_RUNWAY_TICKS` | 30    | Warn when < 30 ticks of upkeep remain |
| `MONEY_LOW_THRESHOLD`             | 100   | Softer "money low" warning            |

**Design intent:** 30 ticks = half a day. Enough time to pause and strategize.

### Death Shutdown

| Constant                   | Value | Purpose                                   |
| -------------------------- | ----- | ----------------------------------------- |
| `DEATH_SPIKE_WINDOW_TICKS` | 60    | Sliding window to count deaths (1 day)    |
| `DEATH_SPIKE_THRESHOLD`    | 10    | Deaths in window to trigger spike warning |
| `SHUTDOWN_WARNING_TICKS`   | 60    | Sustained spike ticks before game over    |

**How it works:**

- Count deaths (panic + misery exits) in the last 60 ticks
- If >= 10 deaths: "deaths spiking" state begins
- Counter increments each tick while spiking
- If counter reaches 60: game over (shutdown)
- If deaths drop below 10: counter resets to 0

**Design intent:** 10 deaths in a day is a lot (you built a death trap). You get a full day to fix it. Stabilize and you're safe.

## Visitors

### Spawning

| Constant                  | Value | Purpose                            |
| ------------------------- | ----- | ---------------------------------- |
| `TICKS_PER_VISITOR_SPAWN` | 5     | One visitor every 5 ticks = 12/day |
| `MAX_VISITORS`            | 50    | Population cap                     |

### Behavior

| Constant                            | Value | Purpose                                           |
| ----------------------------------- | ----- | ------------------------------------------------- |
| `DEFAULT_EXPLORE_TICKS_BEFORE_EXIT` | 45    | Ticks exploring attraction before heading to exit |

**Design intent:** 45 ticks = 3/4 of a day. Long enough to accumulate fear, short enough to avoid happiness decay to misery.

## Emotions

### Starting Values

| Constant                  | Value | Purpose                  |
| ------------------------- | ----- | ------------------------ |
| `VISITOR_START_FEAR`      | 0     | Visitors arrive calm     |
| `VISITOR_START_HAPPINESS` | 60    | Visitors arrive positive |

### Decay & Recovery

| Constant                   | Value | Purpose                         |
| -------------------------- | ----- | ------------------------------- |
| `HAPPINESS_DECAY_PER_TICK` | 1     | Dev iteration / baseline deaths |
| `FEAR_RECOVERY_PER_TICK`   | 2     | Fear reduction on midway        |

**Design intent:** Slow happiness decay gives time to reach amenities. Fear recovery only on midway makes it the safe zone.

### Thresholds

| Constant                     | Value | Purpose                            |
| ---------------------------- | ----- | ---------------------------------- |
| `FEAR_PANIC_THRESHOLD`       | 100   | Fear at or above = panic exit      |
| `HAPPINESS_MISERY_THRESHOLD` | 5     | Happiness below this = misery exit |

## Room Effects

### Attraction Rooms

| Room      | Fear | Happiness | Notes                  |
| --------- | ---- | --------- | ---------------------- |
| `entry`   | 0    | +2        | Slight welcome boost   |
| `hallway` | 0    | 0         | Neutral connector      |
| `scare`   | +6   | 0         | Primary fear generator |
| `exit`    | 0    | 0         | Neutral                |

### Stuck Decay (Attraction Only)

When visitor doesn't move inside attraction:

| Room      | Happiness/tick |
| --------- | -------------- |
| `entry`   | -2             |
| `hallway` | -1             |
| `scare`   | -1             |

**Design intent:** Congestion kills. Standing still in attractions drains happiness.

### Amenity Rooms (Midway Only)

Effects scaled to cost - expensive amenities provide stronger effects:

| Room         | Cost | Happiness | Fear | Purchase | Character         |
| ------------ | ---- | --------- | ---- | -------- | ----------------- |
| `foodStall`  | $150 | +5        | -5   | $10      | Cheap comfort     |
| `firstAid`   | $200 | +3        | -10  | $5       | Fear-focused      |
| `restroom`   | $250 | +8        | -5   | $8       | Basic necessity   |
| `photoBooth` | $275 | +12       | -3   | $15      | Happiness-focused |
| `giftShop`   | $300 | +10       | -5   | $25      | High revenue      |
| `arcade`     | $350 | +15       | -8   | $20      | Best overall      |

**Design intent:** Each amenity has a distinct character. Expensive = stronger but strategic investment.

## Staff System

### Costs

| Constant              | Value | Purpose                                     |
| --------------------- | ----- | ------------------------------------------- |
| `STAFF_HIRE_COST`     | 50    | One-time hire cost                          |
| `STAFF_WAGE_PER_TICK` | 1     | Ongoing wage                                |
| `MAX_STAFF`           | 10    | Global cap                                  |
| `HAUNT_STAFF_CAP`     | 4     | Per-attraction cap (limited by scare rooms) |

### Fear Bonus

| Constant                | Value | Purpose               |
| ----------------------- | ----- | --------------------- |
| `BASE_STAFF_FEAR_BONUS` | 6     | Base for sqrt formula |

**Formula:** `floor(6 * sqrt(staffAssigned))`

| Staff | Bonus |
| ----- | ----- |
| 1     | +6    |
| 2     | +8    |
| 3     | +10   |
| 4     | +12   |

**Key behavior:** Staff bonus applies ONCE per attraction visit (on first scare room), not per-room. Resets when visitor returns to midway.

**Design intent:** Staff provide a flat boost, not multiplicative scaling. Prevents over-powered scare stacking.

## Balance Scenarios

### Fear Math (with new per-visit bonus)

```
Base scare fear:     +6 per room
Staff bonus:         +6 to +12 (once per visit)
Panic threshold:     100

Example: 4 scare rooms, 4 staff
- First room: 6 + 12 = 18 fear
- Rooms 2-4: 6 each = 18 fear
- Total: 36 fear (well below panic)

Example: 4 scare rooms, no staff
- Total: 24 fear

Recovery: 2/tick on midway
- 36 fear = 18 ticks to recover
```

### Income Math

```
Per visitor (45-tick attraction visit):
- Admission: $10 (once)
- Base spend: $1/tick x 45 = $45
- Fear bonus: up to +$4/tick if fear 20-80
- Happiness bonus: decays from 60, limited window

Realistic per visitor: $60-100

Visitor flow: 12/day
Daily income potential: $720-1200
```

### Upkeep Math

```
Small attraction:
- 3 hallways @ $1 = $3/tick
- 2 scare rooms @ $2 = $4/tick
- 2 staff @ $1 = $2/tick
Total: $9/tick = $540/day

Break-even: ~6-8 visitors active
```

## Tuning Log

```
[2025-01-01] Starting money 1000 -> 1500
Reason: $1000 barely covered one attraction with no runway
Result: More comfortable early game

[2025-01-01] Happiness decay 1 -> 0.5
Reason: Visitors hitting misery before reaching amenities
Result: 120 ticks to decay, more time to manage

[2025-01-01] Amenity effects: flat -> scaled to cost
Reason: Expensive amenities didn't feel worth it
Result: Each amenity has distinct character and ROI

[2025-01-01] Explore ticks 30 -> 45
Reason: 30 was dev iteration speed, too fast for real play
Result: Better fear accumulation and revenue

[2025-01-01] Base scare fear 8 -> 6
Reason: Part of scare balance retuning
Result: Lower ceiling, more staff-dependent

[2025-01-01] Staff bonus 10 -> 6, per-room -> per-visit
Reason: Per-room was multiplicative and too powerful
Result: Staff provide flat boost, manageable fear levels

[2025-01-01] Panic threshold 90 -> 100
Reason: More headroom after reducing base fear
Result: Panic requires more deliberate bad design

[2026-01-01] Added death shutdown system
Reason: Need fail condition beyond bankruptcy
Result: 10+ deaths/day sustained for 60 ticks = shutdown

[2025-01-01] Happiness decay 0.5 -> 0.75
Reason: Nobody is dying from misery
Result: 80 ticks to decay, more likely deaths

```
