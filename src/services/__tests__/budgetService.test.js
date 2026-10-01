import { describe, it, expect } from 'vitest';
import { categorySpendThisMonth, suggestMonthlyBudget, budgetStatus } from '../budgetService';

const now = new Date(2026, 8, 20); // 2026-09-20
const at = (monthsAgo, amount, category = 'Alimentação', type = 'expense') => ({
  type,
  category,
  amount: type === 'expense' ? -amount : amount,
  date: new Date(now.getFullYear(), now.getMonth() - monthsAgo, 10).toISOString(),
});

describe('categorySpendThisMonth', () => {
  it('sums only this month, this category, expenses', () => {
    const transactions = [at(0, 100), at(0, 50), at(1, 999), at(0, 10, 'Transporte'), at(0, 500, 'Alimentação', 'income')];
    expect(categorySpendThisMonth(transactions, 'Alimentação', now)).toBe(150);
  });

  it('returns 0 with no matching transactions', () => {
    expect(categorySpendThisMonth([], 'Alimentação', now)).toBe(0);
  });
});

describe('suggestMonthlyBudget', () => {
  it('averages only the months that actually had spend', () => {
    const transactions = [at(1, 300), at(2, 500), at(0, 999)]; // month 0 excluded (current month)
    expect(suggestMonthlyBudget(transactions, 'Alimentação', 3, now)).toBe(400);
  });

  it('returns 0 with no history', () => {
    expect(suggestMonthlyBudget([], 'Alimentação', 3, now)).toBe(0);
  });
});

describe('budgetStatus', () => {
  it('is "none" without a limit set', () => {
    expect(budgetStatus(100, 0)).toEqual({ pct: 0, level: 'none' });
    expect(budgetStatus(100, null)).toEqual({ pct: 0, level: 'none' });
  });

  it('is "ok" under 80%, "warning" from 80%, "over" from 100%', () => {
    expect(budgetStatus(70, 100)).toEqual({ pct: 70, level: 'ok' });
    expect(budgetStatus(80, 100)).toEqual({ pct: 80, level: 'warning' });
    expect(budgetStatus(99, 100)).toEqual({ pct: 99, level: 'warning' });
    expect(budgetStatus(100, 100)).toEqual({ pct: 100, level: 'over' });
    expect(budgetStatus(320, 100)).toEqual({ pct: 320, level: 'over' });
  });
});
