import { describe, it, expect } from 'vitest';
import { buildAlerts, weeklySummary } from '../alertsService';

const now = new Date(2026, 8, 20); // 2026-09-20
const at = (daysAgo, amount, category = 'Alimentação', type = 'expense') => ({
  type,
  category,
  amount: type === 'expense' ? -amount : amount,
  date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo).toISOString(),
});
const daysAgoDate = (days) => new Date(now.getTime() - days * 86400000);

describe('weeklySummary', () => {
  it('returns null with no recent spend', () => {
    expect(weeklySummary([], now)).toBeNull();
  });

  it('compares the last 7 days to the 7 days before', () => {
    const transactions = [at(1, 100), at(2, 100), at(10, 50)];
    const summary = weeklySummary(transactions, now);
    expect(summary.spentThisWeek).toBe(200);
    expect(summary.spentLastWeek).toBe(50);
    expect(summary.message).toContain('mais');
  });
});

describe('buildAlerts', () => {
  it('flags a category at or above 80% of its budget', () => {
    const transactions = [at(1, 85)];
    const categoryBudgets = [{ id: 'Alimentação', category: 'Alimentação', monthlyLimit: 100 }];
    const alerts = buildAlerts({ categoryBudgets, transactions }, now);
    expect(alerts.some((a) => a.id === 'budget-Alimentação' && a.level === 'warning')).toBe(true);
  });

  it('does not flag a category under 80% of its budget', () => {
    const transactions = [at(1, 50)];
    const categoryBudgets = [{ id: 'Alimentação', category: 'Alimentação', monthlyLimit: 100 }];
    const alerts = buildAlerts({ categoryBudgets, transactions }, now);
    expect(alerts.some((a) => a.id === 'budget-Alimentação')).toBe(false);
  });

  it('flags a card invoice at or above 70% of its limit', () => {
    const cards = [{ id: 'c1', name: 'Nubank', limit: 1000, currentInvoice: 750 }];
    const alerts = buildAlerts({ cards, transactions: [] }, now);
    expect(alerts.some((a) => a.id === 'card-c1' && a.level === 'warning')).toBe(true);
  });

  it('flags a small subscription only once it is old enough to review', () => {
    const recentSub = [{ id: 's1', name: 'App X', amount: 15, createdAt: daysAgoDate(10) }];
    const oldSub = [{ id: 's2', name: 'App Y', amount: 15, createdAt: daysAgoDate(90) }];
    expect(buildAlerts({ subscriptions: recentSub, transactions: [] }, now).some((a) => a.id === 'sub-s1')).toBe(false);
    expect(buildAlerts({ subscriptions: oldSub, transactions: [] }, now).some((a) => a.id === 'sub-s2')).toBe(true);
  });

  it('never flags a subscription at or above the small-subscription limit', () => {
    const subscriptions = [{ id: 's3', name: 'Streaming', amount: 50, createdAt: daysAgoDate(200) }];
    expect(buildAlerts({ subscriptions, transactions: [] }, now).some((a) => a.id === 'sub-s3')).toBe(false);
  });

  it('sorts over-budget/over-limit alerts before warnings and info', () => {
    const transactions = [at(1, 150)];
    const categoryBudgets = [{ id: 'Alimentação', category: 'Alimentação', monthlyLimit: 100 }];
    const cards = [{ id: 'c1', name: 'Nubank', limit: 1000, currentInvoice: 750 }];
    const alerts = buildAlerts({ categoryBudgets, cards, transactions }, now);
    expect(alerts[0].level).toBe('over');
  });
});
