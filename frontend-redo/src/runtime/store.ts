import { create } from 'zustand';

import { newGame } from '../core/newGame';
import type { GameState } from '../core/types';

type Actions = {
  newGame: () => void;
};

export const useGameStore = create<GameState & Actions>((set) => ({
  ...newGame(),

  newGame: () => set(newGame()),
}));
