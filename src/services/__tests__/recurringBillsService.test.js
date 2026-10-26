import { describe, it, expect } from 'vitest';
import {
  addMonths,
  dueDateIn,
  firstMonthFor,
  pendingPostings,
  transactionFromBill,
  nextDueDate,
  resumedLastPosted,
  monthlyTotals,
} from '../recurringBillsService';

const now = new Date(2026, 9, 26, 15); // 2026-10-26

describe('dueDateIn', () => {
  it('clamps day 31 to the last day of shorter months', () => {
    expect(dueDateIn({ dayOfMonth: 31 }, '2026-02').getDate()).toBe(28);
    expect(dueDateIn({ dayOfMonth: 31 }, '2026-04').getDate()).toBe(30);
    expect(dueDateIn({ dayOfMonth: 31 }, '2026-10').getDate()).toBe(31);
  });
});

describe('firstMonthFor', () => {
  it('starts next month when this month\'s day already passed', () => {
    expect(firstMonthFor(5, {}, now)).toBe('2026-11');
  });
  it('starts this month when the day is still ahead', () => {
    expect(firstMonthFor(28, {}, now)).toBe('2026-10');
  });
  it('starts this month when she asks to post this month too', () => {
    expect(firstMonthFor(5, { includeThisMonth: true }, now)).toBe('2026-10');
  });
});

describe('pendingPostings', () => {
  const bill = { id: 'b1', name: 'Aluguel', amount: 1200, type: 'expense', category: 'Moradia', dayOfMonth: 5, active: true };

  it('posts this month once its day has arrived', () => {
    const out = pendingPostings([{ ...bill, startMonth: '2026-10', lastPostedMonth: null }], now);
    expect(out.map((p) => p.month)).toEqual(['2026-10']);
  });

  it('does not post before the day arrives', () => {
    const early = new Date(2026, 9, 3, 10);
    expect(pendingPostings([{ ...bill, startMonth: '2026-10', lastPostedMonth: null }], early)).toEqual([]);
  });

  it('catches up every missed month after time away', () => {
    const out = pendingPostings([{ ...bill, startMonth: '2026-07', lastPostedMonth: '2026-07' }], now);
    expect(out.map((p) => p.month)).toEqual(['2026-08', '2026-09', '2026-10']);
  });

  it('does not repost a month already posted', () => {
    expect(pendingPostings([{ ...bill, startMonth: '2026-07', lastPostedMonth: '2026-10' }], now)).toEqual([]);
  });

  it('skips paused bills', () => {
    expect(pendingPostings([{ ...bill, active: false, startMonth: '2026-07', lastPostedMonth: null }], now)).toEqual([]);
  });

  it('never goes back more than a year', () => {
    const out = pendingPostings([{ ...bill, startMonth: '2020-01', lastPostedMonth: null }], now);
    expect(out).toHaveLength(12);
  });
});

describe('transactionFromBill', () => {
  it('makes an expense negative with a deterministic id', () => {
    const tx = transactionFromBill({ id: 'b1', name: 'Aluguel', amount: 1200, type: 'expense', category: 'Moradia' }, '2026-10', new Date(2026, 9, 5, 12));
    expect(tx.id).toBe('rec-b1-2026-10');
    expect(tx.data).toMatchObject({ amount: -1200, type: 'expense', category: 'Moradia', recurringBillId: 'b1', source: 'recurring' });
  });

  it('makes income positive in the Entrada category', () => {
    const tx = transactionFromBill({ id: 'b2', name: 'Salário', amount: 3000, type: 'income' }, '2026-10', new Date(2026, 9, 5, 12));
    expect(tx.data).toMatchObject({ amount: 3000, type: 'income', category: 'Entrada' });
  });
});

describe('nextDueDate', () => {
  it('is next month once this month\'s date has passed or was posted', () => {
    const bill = { dayOfMonth: 5, startMonth: '2026-07', lastPostedMonth: '2026-10' };
    const next = nextDueDate(bill, now);
    expect(next.getMonth()).toBe(10);
    expect(next.getDate()).toBe(5);
  });
  it('is this month when the day is still ahead', () => {
    const next = nextDueDate({ dayOfMonth: 28, startMonth: '2026-10', lastPostedMonth: null }, now);
    expect(next.getMonth()).toBe(9);
    expect(next.getDate()).toBe(28);
  });
});

describe('resumedLastPosted', () => {
  it('skips the paused months', () => {
    expect(resumedLastPosted({ lastPostedMonth: '2026-06' }, now)).toBe('2026-09');
  });
  it('keeps a more recent posted month', () => {
    expect(resumedLastPosted({ lastPostedMonth: '2026-10' }, now)).toBe('2026-10');
  });
});

describe('monthlyTotals', () => {
  it('sums active expenses and income separately', () => {
    const totals = monthlyTotals([
      { amount: 1200, type: 'expense' },
      { amount: 100, type: 'expense' },
      { amount: 3000, type: 'income' },
      { amount: 999, type: 'expense', active: false },
    ]);
    expect(totals).toEqual({ expense: 1300, income: 3000 });
  });
});

describe('addMonths', () => {
  it('crosses year boundaries', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
});
