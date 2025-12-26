# Contributing

This guide shows how to add features to the game following established patterns.

## Core Principles

1. **Logic lives in `src/core/`** - Pure functions, no rendering, no side effects
2. **Types before implementation** - Define types in `types.ts` first
3. **Constants are tunable** - Magic numbers go in `constants.ts`
4. **Tests alongside features** - Write tests for core logic
5. **State flows through Zustand** - `src/runtime/store.ts` is the single source of truth

## Project Structure

```
src/
├── core/           # Pure game logic
│   ├── types.ts    # All type definitions
│   ├── constants.ts # Tunable values
│   ├── visitors/   # Visitor logic
│   └── ...
├── runtime/
│   └── store.ts    # Zustand state + tick loop
├── ui/             # React + Phaser (rendering only)
tests/
├── helpers/
│   └── factories.ts # Test helpers (makeVisitor, makeState, etc.)
└── unit/           # Unit tests mirroring src/ structure
```

## Example: Adding a New Room Type

Let's add a `giftShop` amenity room.

### Step 1: Add the Type

```typescript
// src/core/types.ts
export type RoomType =
  | 'parkEntry'
  | 'parkExit'
  | 'hallway'
  | 'scare'
  | 'entry'
  | 'exit'
  | 'attractionPortal'
  | 'foodStall'
  | 'giftShop'; // <- Add here
```

### Step 2: Add Constants

```typescript
// src/core/constants.ts
export const GIFT_SHOP_COST = 75;
export const GIFT_SHOP_UPKEEP = 1;
export const GIFT_SHOP_HAPPINESS_BOOST = 5;
export const GIFT_SHOP_FEAR_REDUCTION = 2;
export const GIFT_SHOP_BASE_PURCHASE = 30;
```

### Step 3: Add Room Definition

```typescript
// src/core/rooms.ts (or wherever room definitions live)
export const ROOM_DEFINITIONS: Record<RoomType, RoomDefinition> = {
  // ... existing rooms
  giftShop: {
    cost: GIFT_SHOP_COST,
    upkeep: GIFT_SHOP_UPKEEP,
    placementZone: 'midway', // Can only be placed on midway
    walkable: true,
  },
};
```

### Step 4: Add Emotion Effects

```typescript
// src/core/visitors/roomEffects.ts
export const ROOM_EMOTION_EFFECTS: Partial<Record<RoomType, EmotionDelta>> = {
  // ... existing effects
  giftShop: {
    happiness: +GIFT_SHOP_HAPPINESS_BOOST,
    fear: -GIFT_SHOP_FEAR_REDUCTION,
  },
};
```

### Step 5: Add Spending Effect (if applicable)

```typescript
// src/core/visitors/applyRoomEmotionEffects.ts
// If giftShop triggers a purchase on entry, add logic here
// following the existing on-entry pattern
```

### Step 6: Write Tests

```typescript
// tests/unit/core/visitors/giftShop.test.ts
import { GIFT_SHOP_HAPPINESS_BOOST, GIFT_SHOP_FEAR_REDUCTION } from '../../../src/core/constants';
import { applyRoomEmotionEffects } from '../../../src/core/visitors/applyRoomEmotionEffects';
import { makeVisitor } from '../../helpers/factories';

describe('giftShop room effects', () => {
  it('boosts happiness and reduces fear on entry', () => {
    const grid = makeGridWithRoom('giftShop', { x: 1, y: 1 });
    const visitor = makeVisitor({
      position: { x: 1, y: 1 },
      prevPos: { x: 0, y: 1 }, // Moved into room
      happiness: 50,
      fear: 20,
    });

    const [result] = applyRoomEmotionEffects([visitor], grid);

    expect(result.happiness).toBe(50 + GIFT_SHOP_HAPPINESS_BOOST);
    expect(result.fear).toBe(20 - GIFT_SHOP_FEAR_REDUCTION);
  });
});
```

### Step 7: Add to UI (Room Selector)

```typescript
// src/ui/RoomSelector.tsx
// Add giftShop to the midway room options
```

## Patterns to Follow

### Pure Functions

All core logic should be pure:

```typescript
// Good - pure function
export const calculateSpending = (visitor: Visitor): number => {
  if (visitor.happiness <= UNHAPPY_SPEND_STOP) return 0;
  return BASE_SPEND + calculateBonus(visitor);
};

// Bad - side effects
export const calculateSpending = (visitor: Visitor): number => {
  console.log('Calculating...'); // Side effect
  visitor.lastCalculated = Date.now(); // Mutation
  return BASE_SPEND;
};
```

### Immutable Updates

Never mutate, always return new objects:

```typescript
// Good
export const applyFear = (v: Visitor, amount: number): Visitor => ({
  ...v,
  fear: clampEmotion('fear', v.fear + amount),
});

// Bad
export const applyFear = (v: Visitor, amount: number): Visitor => {
  v.fear += amount; // Mutation!
  return v;
};
```

### Test Factories

Use shared factories for consistent test data:

```typescript
// Good - uses factory with overrides
const visitor = makeVisitor({ happiness: 10, fear: 50 });

// Bad - manual object construction
const visitor = {
  id: 1,
  position: { x: 0, y: 0 },
  // ... 15 more fields
};
```

### Location-Gated Logic

Many behaviors differ by location:

```typescript
export const someEffect = (v: Visitor): Visitor => {
  // Skip if not on midway
  if (v.location.type !== 'midway') return v;

  // Apply effect
  return { ...v /* changes */ };
};
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/core/visitors/patience.test.ts

# Watch mode
npm run test:watch
```

## Checklist for New Features

- [ ] Types added to `types.ts`
- [ ] Constants added to `constants.ts`
- [ ] Core logic in `src/core/` as pure functions
- [ ] Test factory updated if new Visitor/State fields
- [ ] Unit tests written
- [ ] Wired into store tick loop (if per-tick)
- [ ] UI updated (if player-facing)
- [ ] Existing tests still pass
