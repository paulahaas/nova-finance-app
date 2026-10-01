import { describe, it, expect } from 'vitest';
import { buildMonthlyClose, monthKeyLabel } from '../monthlyCloseService';

const now = new Date(2026, 8, 20); // 2026-09-20
const at = (monthsAgo, amount, category = 'Alimentação', type = 'expense') => ({
  type,
  category,
  amount: type === 'expense' ? -amount : amount,
  date: new Date(now.getFullYear(), now.getMonth() - monthsAgo, 10).toISOString(),
});

describe('monthKeyLabel', () => {
  it('formats as YYYY-MM', () => {
    expect(monthKeyLabel(now)).toBe('2026-09');
  });
});

describe('buildMonthlyClose', () => {
  it('totals income, expenses and net savings for the current month', () => {
    const transactions = [at(0, 3000, 'Entrada', 'income'), at(0, 1000)];
    const report = buildMonthlyClose({ transactions }, now);
    expect(report.income).toBe(3000);
    expect(report.expenses).toBe(1000);
    expect(report.netSavings).toBe(2000);
  });

  it('suggests a concrete cut when a category runs well above its trailing average', () => {
    const transactions = [at(1, 100), at(2, 100), at(3, 100), at(0, 200)];
    const report = buildMonthlyClose({ transactions }, now);
    const cut = report.cutSuggestions.find((c) => c.category === 'Alimentação');
    expect(cut).toMatchObject({ amount: 200, avgPrior: 100, suggestedCut: 100 });
  });

  it('does not suggest a cut when spend is close to the average', () => {
    const transactions = [at(1, 100), at(2, 100), at(0, 105)];
    const report = buildMonthlyClose({ transactions }, now);
    expect(report.cutSuggestions.find((c) => c.category === 'Alimentação')).toBeUndefined();
  });

  it('builds a suggested budget per category from the trailing average', () => {
    const transactions = [at(1, 100), at(2, 200)];
    const report = buildMonthlyClose({ transactions }, now);
    expect(report.suggestedBudgets['Alimentação']).toBe(150);
  });

  it('flags subscriptions under the small-subscription limit as forgettable', () => {
    const subscriptions = [{ id: 's1', name: 'App X', amount: 15 }, { id: 's2', name: 'Streaming', amount: 50 }];
    const report = buildMonthlyClose({ transactions: [], subscriptions }, now);
    expect(report.forgottenSubscriptions).toEqual([{ id: 's1', name: 'App X', amount: 15 }]);
  });

  it('reports the goal pace as ahead when savings beat the planned monthly contribution', () => {
    const transactions = [at(0, 3000, 'Entrada', 'income'), at(0, 1000)];
    const goals = [{ name: 'Intercâmbio', saved: 0, target: 10000, monthlyContribution: 1000 }];
    const report = buildMonthlyClose({ transactions, goals }, now);
    expect(report.goalPace).toMatchObject({ goalName: 'Intercâmbio', plannedMonthly: 1000, actualContribution: 2000, aheadDays: 30 });
  });

  it('reports the goal pace as behind when savings miss the planned monthly contribution', () => {
    const transactions = [at(0, 1000, 'Entrada', 'income'), at(0, 900)];
    const goals = [{ name: 'Intercâmbio', saved: 0, target: 10000, monthlyContribution: 1000 }];
    const report = buildMonthlyClose({ transactions, goals }, now);
    expect(report.goalPace.aheadDays).toBeLessThan(0);
  });

  it('skips the goal section when there are no goals', () => {
    const report = buildMonthlyClose({ transactions: [] }, now);
    expect(report.goalPace).toBeNull();
  });
});
