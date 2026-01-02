import type { FailureSummary } from '../../../src/core/types';
import { useGameStore } from '../../../src/runtime/store';
import { makeState } from '../../helpers/factories';

describe('Failure Summary', () => {
  beforeEach(() => {
    useGameStore.setState(makeState());
  });

  describe('newGame resets failure summary', () => {
    it('clears failureSummary on new game', () => {
      const mockSummary: FailureSummary = {
        cause: 'bankruptcy',
        finalMoney: 0,
        activeVisitorsAtFail: 0,
        lifetimeVisitors: 10,
        totalDeaths: 2,
        panicDeaths: 1,
        miseryDeaths: 1,
        daysFailed: 5,
        tickFailed: 300,
        recentParkExits: 3,
        recentDeaths: 1,
        deathWarningTicks: 0,
      };

      useGameStore.setState({
        lifecycle: 'failed',
        failureSummary: mockSummary,
      });

      useGameStore.getState().newGame();

      const state = useGameStore.getState();
      expect(state.lifecycle).toBe('title');
      expect(state.failureSummary).toBeNull();
    });
  });

  describe('FailureSummary type', () => {
    it('includes all required fields', () => {
      const summary: FailureSummary = {
        cause: 'death_shutdown',
        finalMoney: 500,
        activeVisitorsAtFail: 12,
        lifetimeVisitors: 50,
        totalDeaths: 15,
        panicDeaths: 10,
        miseryDeaths: 5,
        daysFailed: 10,
        tickFailed: 600,
        recentParkExits: 8,
        recentDeaths: 4,
        deathWarningTicks: 60,
      };

      expect(summary.cause).toBe('death_shutdown');
      expect(summary.totalDeaths).toBe(summary.panicDeaths + summary.miseryDeaths);
    });

    it('supports all failure causes', () => {
      const causes: FailureSummary['cause'][] = ['bankruptcy', 'structural', 'death_shutdown'];

      causes.forEach((cause) => {
        const summary: FailureSummary = {
          cause,
          finalMoney: 0,
          activeVisitorsAtFail: 0,
          lifetimeVisitors: 0,
          totalDeaths: 0,
          panicDeaths: 0,
          miseryDeaths: 0,
          daysFailed: 1,
          tickFailed: 0,
          recentParkExits: 0,
          recentDeaths: 0,
          deathWarningTicks: 0,
        };
        expect(summary.cause).toBe(cause);
      });
    });
  });

  describe('failure state in store', () => {
    it('stores failureSummary when set', () => {
      const mockSummary: FailureSummary = {
        cause: 'structural',
        finalMoney: 1500,
        activeVisitorsAtFail: 5,
        lifetimeVisitors: 20,
        totalDeaths: 0,
        panicDeaths: 0,
        miseryDeaths: 0,
        daysFailed: 3,
        tickFailed: 180,
        recentParkExits: 2,
        recentDeaths: 0,
        deathWarningTicks: 0,
      };

      useGameStore.setState({
        lifecycle: 'failed',
        failureSummary: mockSummary,
      });

      const state = useGameStore.getState();
      expect(state.failureSummary).toEqual(mockSummary);
      expect(state.failureSummary?.cause).toBe('structural');
    });
  });
});
