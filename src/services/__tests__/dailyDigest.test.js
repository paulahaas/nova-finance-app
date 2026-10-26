import { describe, it, expect } from 'vitest';
import { buildDigest } from '../dailyDigest';

const now = new Date(2026, 9, 26, 8, 0); // Monday 2026-10-26
const spend = (amount, category = 'Alimentação') => ({
  type: 'expense',
  category,
  amount: -amount,
  date: new Date(2026, 9, 20, 12).toISOString(),
});

describe('buildDigest', () => {
  it('has nothing to say when nothing needs attention', () => {
    expect(buildDigest({}, {}, new Date(2026, 9, 28, 8)).payload).toBeNull();
  });

  it('notifies about a budget over its limit, once per month', () => {
    const data = { transactions: [spend(150)], categoryBudgets: [{ id: 'Alimentação', category: 'Alimentação', monthlyLimit: 100 }] };
    const first = buildDigest(data, {}, new Date(2026, 9, 28, 8));
    expect(first.payload.body).toContain('Alimentação');
    expect(first.payload.url).toBe('/app/alerts');

    const again = buildDigest(data, first.sent, new Date(2026, 9, 29, 8));
    expect(again.payload).toBeNull();

    const nextMonth = buildDigest({ ...data, transactions: [{ ...spend(150), date: new Date(2026, 10, 3, 12).toISOString() }] }, first.sent, new Date(2026, 10, 4, 8));
    expect(nextMonth.payload).not.toBeNull();
  });

  it('adds the weekly summary only on Mondays', () => {
    const data = { transactions: [spend(40)] };
    expect(buildDigest(data, {}, now).payload.body).toContain('últimos 7 dias');
    expect(buildDigest(data, {}, new Date(2026, 9, 27, 8)).payload).toBeNull();
  });

  it('warns the day before a fixed bill', () => {
    const bill = { id: 'b1', name: 'Aluguel', amount: 1200, type: 'expense', dayOfMonth: 27, startMonth: '2026-10', lastPostedMonth: null, active: true };
    const digest = buildDigest({ recurringBills: [bill] }, {}, now);
    expect(digest.payload.body.replace(/ /g, ' ')).toBe('Amanhã o NOVA lança Aluguel: R$ 1.200,00.');
  });

  it('puts several things in one notification', () => {
    const data = {
      transactions: [spend(150)],
      categoryBudgets: [{ id: 'Alimentação', category: 'Alimentação', monthlyLimit: 100 }],
      cards: [{ id: 'c1', name: 'Nubank', limit: 1000, currentInvoice: 800 }],
    };
    const { payload } = buildDigest(data, {}, new Date(2026, 9, 28, 8));
    expect(payload.body).toMatch(/\(\+1 aviso\)$/);
  });
});
