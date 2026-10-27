import { describe, it, expect } from 'vitest';
import { buildDigest } from '../dailyDigest';

const now = new Date(2026, 9, 26, 21, 0); // Monday 2026-10-26, evening
const withToday = (data, day) => ({ ...data, transactions: [...(data.transactions ?? []), loggedOn(2026, 9, day)] });
const spend = (amount, category = 'Alimentação') => ({
  type: 'expense',
  category,
  amount: -amount,
  date: new Date(2026, 9, 20, 12).toISOString(),
});

// A transaction logged at noon on the given day, so the evening nudge stays quiet.
const loggedOn = (y, m, d) => ({ type: 'expense', category: 'Outros', amount: -5, date: new Date(Date.UTC(y, m, d, 15)).toISOString() });

describe('buildDigest', () => {
  it('has nothing to say when nothing needs attention and today was logged', () => {
    expect(buildDigest({ transactions: [loggedOn(2026, 9, 28)] }, {}, new Date(2026, 9, 28, 21)).payload).toBeNull();
  });

  it('nudges to log the day when nothing was logged today, once a day', () => {
    const first = buildDigest({}, {}, new Date(2026, 9, 28, 21));
    expect(first.payload.body).toContain('gastos de hoje');
    expect(first.payload.url).toBe('/app');
    expect(buildDigest({}, first.sent, new Date(2026, 9, 28, 21)).payload).toBeNull();
    expect(buildDigest({}, first.sent, new Date(2026, 9, 29, 21)).payload).not.toBeNull();
  });

  it('counts a late-night expense (stored in UTC) as today in Brasília time', () => {
    const late = { type: 'expense', category: 'Outros', amount: -5, date: '2026-10-29T01:30:00.000Z' }; // 22:30 on the 28th in BRT
    expect(buildDigest({ transactions: [late] }, {}, new Date(2026, 9, 28, 21)).payload).toBeNull();
  });

  it('notifies about a budget over its limit, once per month', () => {
    const data = { transactions: [spend(150)], categoryBudgets: [{ id: 'Alimentação', category: 'Alimentação', monthlyLimit: 100 }] };
    const first = buildDigest(withToday(data, 28), {}, new Date(2026, 9, 28, 21));
    expect(first.payload.body).toContain('Alimentação');
    expect(first.payload.url).toBe('/app/alerts');

    const again = buildDigest(withToday(data, 29), first.sent, new Date(2026, 9, 29, 21));
    expect(again.payload).toBeNull();

    const nextMonth = buildDigest({ ...data, transactions: [{ ...spend(150), date: new Date(2026, 10, 3, 12).toISOString() }, loggedOn(2026, 10, 4)] }, first.sent, new Date(2026, 10, 4, 21));
    expect(nextMonth.payload).not.toBeNull();
  });

  it('adds the weekly summary only on Mondays', () => {
    const data = { transactions: [spend(40)] };
    expect(buildDigest(withToday(data, 26), {}, now).payload.body).toContain('últimos 7 dias');
    expect(buildDigest(withToday(data, 27), {}, new Date(2026, 9, 27, 21)).payload).toBeNull();
  });

  it('warns the day before a fixed bill', () => {
    const bill = { id: 'b1', name: 'Aluguel', amount: 1200, type: 'expense', dayOfMonth: 27, startMonth: '2026-10', lastPostedMonth: null, active: true };
    const digest = buildDigest(withToday({ recurringBills: [bill] }, 26), { 'weekly-summary': '2026-10-26' }, now);
    expect(digest.payload.body.replace(/ /g, ' ')).toBe('Amanhã o NOVA lança Aluguel: R$ 1.200,00.');
  });

  it('puts several things in one notification', () => {
    const data = {
      transactions: [spend(150)],
      categoryBudgets: [{ id: 'Alimentação', category: 'Alimentação', monthlyLimit: 100 }],
      cards: [{ id: 'c1', name: 'Nubank', limit: 1000, currentInvoice: 800 }],
    };
    const { payload } = buildDigest(withToday(data, 28), {}, new Date(2026, 9, 28, 21));
    expect(payload.body).toMatch(/\(\+1 aviso\)$/);
  });
});
