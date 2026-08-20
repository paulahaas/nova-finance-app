import { describe, it, expect } from 'vitest';
import { financialScore } from '../financeService';

describe('financialScore', () => {
  it('scores a healthy month (good savings, low commitments, on-track goals) as Saudável', () => {
    const result = financialScore({
      monthIncome: 5000,
      monthExpenses: 3500,
      subscriptionsTotal: 100,
      anomalyCount: 0,
      goalsOnTrackRatio: 1,
    });
    expect(result.tone).toBe('good');
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it('scores a tight month (spends everything, many anomalies) low', () => {
    const result = financialScore({
      monthIncome: 3000,
      monthExpenses: 3200,
      subscriptionsTotal: 900,
      anomalyCount: 3,
      goalsOnTrackRatio: 0,
    });
    expect(result.tone).toBe('alert');
    expect(result.score).toBeLessThan(45);
  });

  it('never goes below 0 or above 100', () => {
    const zeroIncome = financialScore({ monthIncome: 0, monthExpenses: 0, subscriptionsTotal: 0, anomalyCount: 0, goalsOnTrackRatio: 0 });
    expect(zeroIncome.score).toBeGreaterThanOrEqual(0);
    expect(zeroIncome.score).toBeLessThanOrEqual(100);
  });
});
