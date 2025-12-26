import { fireEvent, render, screen } from '@testing-library/react';

import { useGameStore } from '../../../src/runtime/store';
import { Hud } from '../../../src/ui/Hud';

jest.mock('../../../src/runtime/store', () => ({
  useGameStore: jest.fn(),
}));

type MockState = {
  lifecycle: 'paused' | 'running' | 'stopped' | 'failed';
  day: number;
  tick: number;
  money: number;
  visitors: { id: string; x: number; y: number }[];
  currentView: { type: 'midway' } | { type: 'attraction'; attractionId: string };
  attractions: Record<string, { id: string; name: string }>;
  midwayGrid: { roomType: string | null; portalTo?: string }[][];
  entrance: { x: number; y: number } | null;
  exit: { x: number; y: number } | null;
  selectedRoomType: string;
  targetAttractionId: string | null;
  newGame: jest.Mock;
  viewMidway: jest.Mock;
  viewAttraction: jest.Mock;
  resume: jest.Mock;
  pause: jest.Mock;
  dispatchInput: jest.Mock;
  setTargetAttraction: jest.Mock;
  createAttraction: jest.Mock;
};

type Selector<T> = (state: MockState) => T;

describe('Hud', () => {
  it('renders derived state and calls newGame on click', () => {
    const newGame = jest.fn();

    const state: MockState = {
      lifecycle: 'paused',
      day: 1,
      tick: 0,
      money: 1000,
      visitors: [
        { id: 'v1', x: 0, y: 0 },
        { id: 'v2', x: 1, y: 0 },
      ],
      currentView: { type: 'midway' },
      attractions: {},
      midwayGrid: [[{ roomType: null }]],
      entrance: null,
      exit: null,
      selectedRoomType: 'hallway',
      targetAttractionId: null,
      newGame,
      viewMidway: jest.fn(),
      viewAttraction: jest.fn(),
      resume: jest.fn(),
      pause: jest.fn(),
      dispatchInput: jest.fn(),
      setTargetAttraction: jest.fn(),
      createAttraction: jest.fn(),
    };

    const useGameStoreMock = useGameStore as unknown as jest.MockedFunction<
      <T>(selector: Selector<T>) => T
    >;

    useGameStoreMock.mockImplementation(<T,>(selector: Selector<T>) => selector(state));

    render(<Hud />);

    expect(screen.getByText(/Lifecycle:/)).toHaveTextContent('Lifecycle: paused');
    expect(screen.getByText(/Day:/)).toHaveTextContent('Day: 1');
    expect(screen.getByText(/Tick:/)).toHaveTextContent('Tick: 0');
    expect(screen.getByText(/Money:/)).toHaveTextContent('Money: $1000');
    expect(screen.getByText(/Visitors:/)).toHaveTextContent('Visitors: 2');

    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(screen.getByRole('status')).toHaveTextContent('New Game Started');
    expect(newGame).toHaveBeenCalledTimes(1);
  });
});
