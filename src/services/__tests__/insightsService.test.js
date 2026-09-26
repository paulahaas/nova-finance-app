import { describe, it, expect } from 'vitest';
import { categoryAnomalies, buildInsights } from '../insightsService';

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

describe('buildInsights', () => {
  const at = (monthsAgo, type, amount, category = 'Alimentação') => ({
    type,
    category,
    amount: type === 'expense' ? -amount : amount,
    date: new Date(new Date().getFullYear(), new Date().getMonth() - monthsAgo, 10).toISOString(),
  });

  it('returns nothing when there is no data', () => {
    expect(buildInsights({})).toEqual([]);
  });

  it('reports spending change, savings rate and top category from real data', () => {
    const insights = buildInsights({
      transactions: [at(0, 'income', 2000), at(0, 'expense', 600), at(1, 'expense', 400)],
    });
    const text = insights.map((i) => i.text).join(' ');
    expect(text).toContain('50% acima do mês passado');
    expect(text).toContain('guardando 70% da renda');
    expect(text).toContain('maior gasto deste mês é Alimentação');
  });

  it('warns when spending exceeds income and totals subscriptions', () => {
    const insights = buildInsights({
      transactions: [at(0, 'income', 500), at(0, 'expense', 800)],
      subscriptions: [{ amount: 40 }, { amount: 10 }],
    });
    const text = insights.map((i) => i.text).join(' ');
    expect(text).toContain('a mais do que entrou');
    expect(text).toContain('assinaturas somam');
  });
});
