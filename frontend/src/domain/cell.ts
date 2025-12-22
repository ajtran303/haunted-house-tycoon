export type Cell = {
  type: 'empty' | 'wall' | 'floor';
  occupied: boolean;
  roomId: string | null;
};
