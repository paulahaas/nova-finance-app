import { describe, it, expect } from 'vitest';
import { financialScore, primaryGoal, evaluatePurchase } from '../financeService';

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

describe('primaryGoal', () => {
  it('picks the goal marked priority over goals[0]', () => {
    const goals = [{ id: 'g1', name: 'Carro' }, { id: 'g2', name: 'Intercâmbio', priority: true }];
    expect(primaryGoal(goals).id).toBe('g2');
  });

  it('falls back to goals[0] when none is marked priority', () => {
    const goals = [{ id: 'g1', name: 'Carro' }, { id: 'g2', name: 'Casa' }];
    expect(primaryGoal(goals).id).toBe('g1');
  });

  it('returns null with no goals', () => {
    expect(primaryGoal([])).toBeNull();
  });
});

describe('evaluatePurchase goal delay', () => {
  it('bases the delay estimate on the priority goal, not goals[0]', () => {
    const goals = [
      { id: 'g1', name: 'Carro', monthlyContribution: 100 },
      { id: 'g2', name: 'Intercâmbio', priority: true, monthlyContribution: 1000 },
    ];
    const result = evaluatePurchase({ price: 1000, available: 5000, monthlyIncome: 3000, goals });
    expect(result.goalDelayDays).toBe(30); // 1000/1000 * 30, not 1000/100 * 30
  });
});
