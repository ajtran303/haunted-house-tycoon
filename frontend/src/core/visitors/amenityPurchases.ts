import { AMENITY_BASE_PURCHASE } from '../constants';
import type { Grid, RoomType, Visitor } from '../types';
import { spendingPerTick } from './spending';

const AMENITY_ROOM_TYPES: RoomType[] = ['foodStall'];

const isAmenity = (roomType: RoomType | null): boolean =>
  roomType !== null && AMENITY_ROOM_TYPES.includes(roomType);

const didEnterNewTile = (v: Visitor): boolean =>
  v.prevPos !== null && (v.prevPos.x !== v.position.x || v.prevPos.y !== v.position.y);

const getRoomTypeAt = (grid: Grid, x: number, y: number): RoomType | null => {
  const cell = grid[y]?.[x];
  return (cell?.roomType ?? null) as RoomType | null;
};

/**
 * Calculate purchase amount for a visitor entering an amenity.
 * Uses the existing spending multiplier (fear/happiness bonuses).
 */
export const amenityPurchaseAmount = (v: Visitor): number => {
  const multiplier = spendingPerTick(v);
  return AMENITY_BASE_PURCHASE * multiplier;
};

/**
 * Calculate total amenity purchases for all visitors this tick.
 * Only applies when a visitor enters an amenity cell (once per entry).
 */
export const calculateAmenityPurchases = (visitors: Visitor[], grid: Grid): number => {
  let total = 0;

  for (const v of visitors) {
    // Only count visitors who just entered a new tile
    if (!didEnterNewTile(v)) continue;

    // Only on midway (amenities are midway-only)
    if (v.location.type !== 'midway') continue;

    const roomType = getRoomTypeAt(grid, v.position.x, v.position.y);
    if (!isAmenity(roomType)) continue;

    total += amenityPurchaseAmount(v);
  }

  return total;
};
