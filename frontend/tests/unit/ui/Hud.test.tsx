import { fireEvent, render, screen } from '@testing-library/react';

import { useGameStore } from '../../../src/runtime/store';
import { Hud } from '../../../src/ui/Hud';

jest.mock('../../../src/runtime/store', () => ({
  useGameStore: jest.fn(),
}));

type MockState = {
  lifecycle: 'paused' | 'running' | 'stopped' | 'failed';
  currentView: { type: 'midway' } | { type: 'attraction'; attractionId: string };
  attractions: Record<string, { id: string; name: string; entryPoint: { x: number; y: number }; exitPoint: { x: number; y: number }; grid: { roomType: string | null }[][] }>;
  visitors: { id: number; location: { type: string; attractionId?: string } }[];
  midwayGrid: { roomType: string | null; portalTo?: string }[][];
  entrance: { x: number; y: number } | null;
  exit: { x: number; y: number } | null;
  selectedRoomType: string | null;
  targetAttractionId: string | null;
  speed: number;
  newGame: jest.Mock;
  viewMidway: jest.Mock;
  viewAttraction: jest.Mock;
  resume: jest.Mock;
  pause: jest.Mock;
  dispatchInput: jest.Mock;
  setTargetAttraction: jest.Mock;
  createAttraction: jest.Mock;
  setSpeed1x: jest.Mock;
  setSpeed4x: jest.Mock;
  setSpeed10x: jest.Mock;
};

type Selector<T> = (state: MockState) => T;

describe('Hud', () => {
  const createMockState = (overrides: Partial<MockState> = {}): MockState => ({
    lifecycle: 'paused',
    currentView: { type: 'midway' },
    attractions: {},
    visitors: [],
    midwayGrid: [[{ roomType: null }]],
    entrance: null,
    exit: null,
    selectedRoomType: null,
    targetAttractionId: null,
    speed: 1,
    newGame: jest.fn(),
    viewMidway: jest.fn(),
    viewAttraction: jest.fn(),
    resume: jest.fn(),
    pause: jest.fn(),
    dispatchInput: jest.fn(),
    setTargetAttraction: jest.fn(),
    createAttraction: jest.fn(),
    setSpeed1x: jest.fn(),
    setSpeed4x: jest.fn(),
    setSpeed10x: jest.fn(),
    ...overrides,
  });

  it('renders title and calls newGame on reset click', () => {
    const newGame = jest.fn();
    const state = createMockState({ newGame });

    const useGameStoreMock = useGameStore as unknown as jest.MockedFunction<
      <T>(selector: Selector<T>) => T
    >;

    useGameStoreMock.mockImplementation(<T,>(selector: Selector<T>) => selector(state));

    render(<Hud />);

    expect(screen.getByText('Haunted House Tycoon')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset game/i }));
    expect(screen.getByRole('status')).toHaveTextContent('New Game Started');
    expect(newGame).toHaveBeenCalledTimes(1);
  });

  it('shows view switcher and speed controls when running', () => {
    const state = createMockState({ lifecycle: 'running' });

    const useGameStoreMock = useGameStore as unknown as jest.MockedFunction<
      <T>(selector: Selector<T>) => T
    >;

    useGameStoreMock.mockImplementation(<T,>(selector: Selector<T>) => selector(state));

    render(<Hud />);

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /midway/i })).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
  });
});
