export type Dir = 'U' | 'L' | 'D' | 'R';
export const DIRS: Dir[] = ['U', 'L', 'D', 'R'];

export const dirToDelta = (d: Dir) => {
  switch (d) {
    case 'U':
      return { x: 0, y: -1 };
    case 'L':
      return { x: -1, y: 0 };
    case 'D':
      return { x: 0, y: 1 };
    case 'R':
      return { x: 1, y: 0 };
  }
};

export const rotateCCW = (start: Dir): Dir[] => {
  const i = DIRS.indexOf(start);
  return [DIRS[i], DIRS[(i + 1) % 4], DIRS[(i + 2) % 4], DIRS[(i + 3) % 4]];
};
