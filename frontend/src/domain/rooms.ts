export type RoomType = 'entry' | 'hallway' | 'scare';

export const ROOM_DEFS: 
  Record<RoomType, { cost: number; cellType: 'floor'}> = {
    entry: { cost: 200, cellType: 'floor'},
    hallway: { cost: 100, cellType: 'floor'},
    scare: { cost: 500, cellType: 'floor'}
};
