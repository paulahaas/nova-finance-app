import { describe, it, expect } from 'vitest';
import { categoryAnomalies } from '../insightsService';

function expenseInMonthsAgo(monthsAgo, amount, category) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 10);
  return { type: 'expense', category, amount: -Math.abs(amount), date: d.toISOString() };
}

describe('categoryAnomalies', () => {
  it('flags a category whose current-month spend far exceeds its trailing average', () => {
    const transactions = [
      expenseInMonthsAgo(0, 900, 'Alimentação'),
      expenseInMonthsAgo(1, 450, 'Alimentação'),
      expenseInMonthsAgo(2, 460, 'Alimentação'),
      expenseInMonthsAgo(3, 440, 'Alimentação'),
    ];
    const anomalies = categoryAnomalies(transactions);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].category).toBe('Alimentação');
    expect(anomalies[0].percentAbove).toBeGreaterThan(50);
  });

  it('does not flag a category that stayed within its normal range', () => {
    const transactions = [
      expenseInMonthsAgo(0, 470, 'Transporte'),
      expenseInMonthsAgo(1, 450, 'Transporte'),
      expenseInMonthsAgo(2, 460, 'Transporte'),
    ];
    expect(categoryAnomalies(transactions)).toHaveLength(0);
  });

  it('does not flag a category with no prior history to compare against', () => {
    const transactions = [expenseInMonthsAgo(0, 900, 'Viagens')];
    expect(categoryAnomalies(transactions)).toHaveLength(0);
  });
});
