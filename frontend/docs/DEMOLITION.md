# Demolition Feature

Allow players to remove placed rooms to fix mistakes and iterate on layouts.

## Overview

Demolition is the inverse of room placement. Players select a "demolish" tool, click on a room, and it reverts to an empty tile. This enables experimentation without permanent consequences (in Normal mode).

## Tickets

### Core

1. **Demolition as Core Mechanic** - Basic removal logic
2. **Demolition Constraints** - What can/cannot be demolished
3. **Demolition Economy** - No refund, no cost, upkeep stops

### UI/UX

4. **Demolition UI** - Tool selection in room selector
5. **Demolition Visual Feedback** - Hover states, highlights

### Integration

6. **Demolition Lifecycle** - State transitions, mode deactivation
7. **Game Mode: Hardcore (Post-Beta)** - Gate demolition behind difficulty

## Architecture

### State

Demolition doesn't add new state fields. It modifies existing grid cells:

```
midwayGrid[y][x] = { type: 'floor', occupied: false, roomType: null, ... }
attractionGrid[y][x] = { type: 'empty', occupied: false, roomType: null, ... }
```

The room selector already tracks `selectedRoomType`. Demolition can either:

- Add a special `'demolish'` value to `selectedRoomType`
- Or add a separate `isDemolishMode: boolean` to state

The first approach reuses existing patterns; the second is more explicit.

### Key Files

| File                                 | Role                                     |
| ------------------------------------ | ---------------------------------------- |
| `src/core/types.ts`                  | RoomType union, GameState shape          |
| `src/core/placement.ts`              | Room placement logic (study for inverse) |
| `src/core/constants.ts`              | Room costs, upkeep values                |
| `src/runtime/store.ts`               | Actions: `placeRoomAt`, add `demolishAt` |
| `src/ui/RoomSelector.tsx`            | Tool selection UI                        |
| `src/ui/phaser/render/renderGrid.ts` | Grid rendering, hover highlights         |

### Placement as Reference

Study `placeRoomAt` in `store.ts` and `placeRoom` in `placement.ts`. Demolition follows the inverse pattern:

**Placement flow:**

1. Validate (money, bounds, not occupied)
2. Deduct cost
3. Update grid cells
4. Update derived state (entrance/exit positions)

**Demolition flow:**

1. Validate (is room, is demolishable type, no visitor present)
2. No cost change (no refund)
3. Revert grid cells to floor/empty
4. Upkeep recalculates automatically (already derived from grid)

### Constraints Implementation

Rooms fall into two categories:

**Demolishable:**

- `hallway`, `scare`
- `foodStall`, `giftShop`, `restroom`, `photoBooth`, `arcade`, `firstAid`

**Protected:**

- `parkEntry`, `parkExit` (midway infrastructure)
- `entry`, `exit` (attraction infrastructure)
- `attractionPortal` (complex visitor state)

Create a constant set or helper function:

```ts
const DEMOLISHABLE_ROOMS: Set<RoomType> = new Set([...]);
const canDemolish = (roomType: RoomType) => DEMOLISHABLE_ROOMS.has(roomType);
```

For visitor presence, check `visitors` array for any visitor at the target position and location (midway vs attraction).

### Multi-Cell Rooms

Some rooms occupy multiple cells (trominoes, 2x2 portals). Placement uses `getRoomCells()` from `placement.ts` to determine affected cells.

Demolition must handle this: when demolishing any cell of a multi-cell room, remove all cells. Options:

- Store `roomId` on each cell, find all cells with same ID
- Use `getRoomCells()` with the room's origin position

The existing `roomId` field on cells should support this.

### Visual Feedback

The grid renderer already supports hover highlights for placement preview. Extend this for demolition:

- Reuse highlight rectangle system
- Red tint for demolishable rooms
- Gray/blocked indicator for protected rooms
- No highlight for empty tiles

Check `renderGrid.ts` for the existing `highlight` graphics object and hover detection.

### UI Integration

`RoomSelector.tsx` renders room type buttons. Add a "Demolish" button that:

- Sets demolish mode (via `dispatchInput` or new action)
- Shows active state when selected
- Deselects any room type

The click handler in `renderGrid.ts` or `BootScene.ts` checks if demolish mode is active and calls `demolishAt(x, y)` instead of `placeRoomAt(x, y)`.

## Testing Strategy

### Unit Tests

| Test                 | Location                                      |
| -------------------- | --------------------------------------------- |
| `canDemolish` helper | `tests/unit/core/demolition.test.ts`          |
| `demolishAt` action  | `tests/unit/runtime/store.demolition.test.ts` |
| Visitor blocking     | Same as above                                 |
| Multi-cell cleanup   | Same as above                                 |

### Test Cases

- Demolish hallway → cell becomes empty
- Demolish protected room → rejected, state unchanged
- Demolish with visitor present → rejected
- Demolish multi-cell room → all cells cleared
- Demolish when paused → rejected
- Upkeep decreases after demolition

## Edge Cases

1. **Visitor on tile** - Check both `position` and `location` (midway vs attraction)
2. **Multi-cell rooms** - Demolishing any cell removes entire room
3. **View switching** - Exit demolish mode when switching midway ↔ attraction
4. **Lifecycle** - Only allow demolition when `lifecycle === 'running'`

## Future: Hardcore Mode

Post-beta, demolition becomes a Normal mode feature. Hardcore mode disables it entirely.

This will require:

- Game mode state (`gameMode: 'normal' | 'hardcore'`)
- Mode selection UI (new game screen or modal)
- Conditional rendering of demolish button
- Guard in `demolishAt` action

Keep demolition logic intact; just gate access to it.

## Implementation Order

1. Core logic (`demolishAt` action, constraints)
2. Wire to existing click handler
3. Add demolish button to UI
4. Visual feedback (hover states)
5. Tests
6. Lifecycle guards
7. (Post-beta) Hardcore mode gating
