import { RoomType } from './types';

// =============================================================================
// GRID & TIME
// =============================================================================

export const GRID_WIDTH = 18;
export const GRID_HEIGHT = 12;

export const START_DAY = 1;
export const START_TICK = 0;

// 60 ticks = 1 day. At 1x speed, ~1 tick/second, so 1 day = 1 minute real-time.
export const TICKS_PER_DAY = 60;
export const NIGHT_START_TICK = Math.floor(TICKS_PER_DAY * 0.5);

// =============================================================================
// ECONOMY - STARTING RESOURCES
// =============================================================================

// Player starts with $1500. Enough to build a small attraction + comfortable runway.
export const STARTING_MONEY = 1500;

// Admission fee charged when visitor enters the park.
export const ADMISSION_FEE = 10;

// =============================================================================
// ECONOMY - WARNINGS
// =============================================================================

// Bankruptcy warning triggers when money covers fewer than this many ticks of upkeep.
// At 30 ticks, player has ~half a day to react. Gives time to pause and strategize.
export const BANKRUPTCY_WARNING_RUNWAY_TICKS = 30;

// "Money low" warning threshold. Separate from bankruptcy - this is a softer alert.
export const MONEY_LOW_THRESHOLD = 100;

// =============================================================================
// DEATH SHUTDOWN SYSTEM
// =============================================================================

// Deaths (panic + misery exits) trigger investigation. Sustained deaths = shutdown.
// Window: 60 ticks (1 day) to count recent deaths
// Threshold: 10+ deaths in window triggers "spiking" state (you built a death trap)
// Grace: 60 ticks of sustained spiking before game over
// This gives players time to react while creating real pressure.

export const DEATH_SPIKE_WINDOW_TICKS = 60; // Sliding window to count deaths
export const DEATH_SPIKE_THRESHOLD = 10; // Deaths in window to trigger spike
export const SHUTDOWN_WARNING_TICKS = 60; // Sustained spike ticks before game over

// =============================================================================
// GRID POSITIONS
// =============================================================================

export const ENTRANCE_X = 0;
export const ENTRANCE_Y = 0;

// =============================================================================
// ROOM COSTS (one-time purchase)
// =============================================================================

export const ROOM_COST: Record<RoomType, number> = {
  // Core attraction rooms
  entry: 50, // Cheap - required for every attraction
  exit: 50, // Cheap - required for every attraction
  hallway: 100, // Moderate - filler/pathing
  scare: 200, // Expensive - main revenue driver

  // Park infrastructure (free - auto-placed or system rooms)
  parkEntry: 0,
  parkExit: 0,
  attractionPortal: 0,

  // Amenities (3-cell trominoes) - invest to boost happiness/reduce fear
  foodStall: 150, // L-up-left shape
  giftShop: 300, // I-horizontal shape
  restroom: 250, // I-vertical shape
  photoBooth: 275, // L-up-right shape
  arcade: 350, // L-down-right shape
  firstAid: 200, // L-down-left shape
};

// =============================================================================
// ROOM UPKEEP (per-tick drain)
// =============================================================================

export const BASE_UPKEEP_PER_TICK = 0;

export const ROOM_UPKEEP_PER_TICK: Partial<Record<RoomType, number>> = {
  entry: 0,
  hallway: 1, // Small drain - incentivizes efficient layouts
  scare: 2, // Higher drain - risk/reward tradeoff
  exit: 0,
  parkEntry: 0,
  parkExit: 0,
  // Amenities: 0 upkeep for now (they cost to build, provide passive benefit)
  foodStall: 0,
  giftShop: 0,
  restroom: 0,
  photoBooth: 0,
  arcade: 0,
  firstAid: 0,
};

// =============================================================================
// VISITOR SPAWNING
// =============================================================================

// Spawn 1 visitor every 5 ticks = 12 visitors per day at capacity.
// Balances income rate against park capacity.
export const TICKS_PER_VISITOR_SPAWN = 5;

// Hard cap prevents performance issues and forces quality over quantity.
export const MAX_VISITORS = 50;

// Legacy/testing constant - may be removed.
export const MONEY_PER_VISITOR_PER_TICK = 5;

// =============================================================================
// EMOTION BOUNDS
// =============================================================================

export const EMOTION_MIN = 0;
export const EMOTION_MAX = 100;

export const EMOTION_BOUNDS = {
  fear: { min: 0, max: 100 },
  happiness: { min: 0, max: 100 },
} as const;

// =============================================================================
// VISITOR STARTING STATE
// =============================================================================

export const VISITOR_START_FEAR = 0; // Fresh visitors aren't scared yet
export const VISITOR_START_HAPPINESS = 60; // Starts positive but has room to grow/fall

// =============================================================================
// HAPPINESS SYSTEM
// =============================================================================

// Happiness decays 0.75/tick. At start=60, visitor has 80 ticks (~1.3 days) before hitting 0.
// Slower decay gives time to reach amenities while still creating pressure.
export const HAPPINESS_DECAY_PER_TICK = 0.75;

// Happiness thresholds for spending behavior:
export const HAPPY_SPEND_BOOST_START = 60; // Above this: bonus spending
export const UNHAPPY_SPEND_STOP = 10; // At/below this: stops spending entirely
export const HAPPINESS_MISERY_THRESHOLD = 5; // Below this: visitor exits (misery death)
export const MAX_HAPPY_BONUS_PER_TICK = 6; // Max bonus at happiness=100

// =============================================================================
// FEAR SYSTEM
// =============================================================================

// Fear Balance Design:
// - Scare rooms add +8 fear (see roomEffects.ts)
// - Midway recovery is 2/tick, so 1 scare room = 4 ticks to recover
// - This 4:1 ratio ensures attractions feel risky, midway feels like relief
// - 3 scare rooms = 12 ticks of midway time needed to fully recover
// - Amenities provide -5 fear (faster recovery but costs money to build)
// - Panic threshold (90) requires ~11 scare rooms from 0 fear to trigger

export const FEAR_RECOVERY_PER_TICK = 2; // Midway provides gradual relief

// Fear thresholds for spending behavior:
export const FEAR_SPEND_BOOST_START = 20; // Below this: no fear bonus
export const FEAR_SPEND_BOOST_CAP = 80; // At/above this: max bonus (but not panicking)
export const FEAR_PANIC_THRESHOLD = 100; // At/above this: visitor exits (panic death)
export const MAX_FEAR_BONUS_PER_TICK = 4; // Max bonus at fear=80

// =============================================================================
// SPENDING RATES
// =============================================================================

// Base spend: $1/tick. A visitor staying 60 ticks generates $60 base revenue.
// Fear bonus (up to +$4) and happiness bonus (up to +$6) can boost this to $11/tick.
export const BASE_SPEND_PER_TICK = 1;

// =============================================================================
// VISITOR BEHAVIOR
// =============================================================================

// How long a visitor explores an attraction before heading to exit.
// 30 ticks = half a day. Shorter for dev iteration.
export const DEFAULT_EXPLORE_TICKS_BEFORE_EXIT = 45;

// =============================================================================
// AMENITY EFFECTS (applied once on entry to amenity tile)
// Scaled to cost: expensive amenities provide stronger effects.
// Base unit: foodStall ($150) = +5 happiness, -5 fear, $10 purchase
// =============================================================================

export type AmenityEffect = {
  happiness: number; // Instant happiness boost
  fear: number; // Fear reduction (negative = reduces fear)
  purchase: number; // Immediate spend when using amenity
};

export const AMENITY_EFFECTS: Record<string, AmenityEffect> = {
  // $150 - cheap comfort food, modest effect
  foodStall: { happiness: 5, fear: -5, purchase: 10 },

  // $200 - medical care, focuses on calming fear
  firstAid: { happiness: 3, fear: -10, purchase: 5 },

  // $250 - basic necessity, balanced effect
  restroom: { happiness: 8, fear: -5, purchase: 8 },

  // $275 - fun memory, happiness-focused
  photoBooth: { happiness: 12, fear: -3, purchase: 15 },

  // $300 - retail therapy, high spend + happiness
  giftShop: { happiness: 10, fear: -5, purchase: 25 },

  // $350 - most expensive, strongest overall effect
  arcade: { happiness: 15, fear: -8, purchase: 20 },
};

// Legacy flat constants (for backwards compatibility if needed)
export const AMENITY_HAPPINESS_BOOST = 5;
export const AMENITY_FEAR_REDUCTION = 5;
export const AMENITY_BASE_PURCHASE = 10;

// =============================================================================
// STAFF SYSTEM
// =============================================================================

export const STAFF_HIRE_COST = 50; // One-time cost to hire
export const STAFF_WAGE_PER_TICK = 1; // Ongoing drain per staff member
export const MAX_STAFF = 10; // Global staff cap
export const HAUNT_STAFF_CAP = 4; // Max staff per attraction (capped by scare rooms)

// Fear bonus from staff: floor(BASE * sqrt(assigned))
// 1 staff = +6 fear, 2 staff = +8, 3 staff = +10, 4 staff = +12
// Applied once per attraction visit (not per room).
// Diminishing returns prevent staff from being a complete solution.
export const BASE_STAFF_FEAR_BONUS = 6;
