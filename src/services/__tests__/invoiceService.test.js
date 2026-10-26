import { describe, it, expect } from 'vitest';
import { cardInvoiceView } from '../invoiceService';

const now = new Date(2026, 9, 26, 15); // 2026-10-26
const tx = (cardId, amount, month, day = 10, extra = {}) => ({
  cardId,
  type: 'expense',
  amount: -amount,
  description: 'x',
  date: new Date(2026, month, day, 12).toISOString(),
  ...extra,
});

describe('cardInvoiceView', () => {
  it('adds up this month for the chosen card only', () => {
    const view = cardInvoiceView([tx('c1', 45, 9), tx('c1', 20, 9, 12), tx('c2', 999, 9), tx('c1', 500, 8)], 'c1', now);
    expect(view.current.total).toBe(65);
    expect(view.current.items).toHaveLength(2);
  });

  it('ignores income and transactions without this card', () => {
    const view = cardInvoiceView([{ ...tx('c1', 100, 9), type: 'income' }, tx(null, 30, 9)], 'c1', now);
    expect(view.current.total).toBe(0);
  });

  it('lists the next months that already carry installments', () => {
    const transactions = [tx('c1', 100, 10, 5, { installmentIndex: 2 }), tx('c1', 100, 11, 5, { installmentIndex: 3 }), tx('c1', 40, 13, 5)];
    const view = cardInvoiceView(transactions, 'c1', now);
    expect(view.upcoming.map((m) => m.key)).toEqual(['2026-11', '2026-12']);
    expect(view.upcoming[0].total).toBe(100);
  });

  it('moves a purchase made after the closing day to next invoice', () => {
    // closes on the 20th: the 10th is in this invoice, the 22nd already belongs to November's
    const transactions = [tx('c1', 100, 9, 10), tx('c1', 40, 9, 22)];
    const onDay20 = new Date(2026, 9, 18, 12);
    const view = cardInvoiceView(transactions, 'c1', onDay20, 20);
    expect(view.current.key).toBe('2026-10');
    expect(view.current.total).toBe(100);
    expect(view.upcoming.map((m) => [m.key, m.total])).toEqual([['2026-11', 40]]);
  });

  it('opens the next invoice once today is past the closing day', () => {
    const view = cardInvoiceView([tx('c1', 40, 9, 22)], 'c1', new Date(2026, 9, 26, 12), 20);
    expect(view.current.key).toBe('2026-11');
    expect(view.current.total).toBe(40);
  });

  it('sorts a month newest first', () => {
    const view = cardInvoiceView([tx('c1', 1, 9, 3), tx('c1', 2, 9, 20)], 'c1', now);
    expect(view.current.items.map((t) => Math.abs(t.amount))).toEqual([2, 1]);
  });
});
