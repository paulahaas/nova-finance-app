// Fixed/recurring bills ("contas fixas"): rent, internet, a monthly salary...
// Registered once, posted as ordinary transactions on their day each month,
// so every feature that reads the flat `transactions` list (Dashboard,
// budgets, closing report, Copilot) sees them with no extra code. Pure, no
// Firebase.

const pad = (n) => String(n).padStart(2, '0');

export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + n, 1));
}

/** The bill's due date inside month `key`; day 31 becomes the last day of shorter months. */
export function dueDateIn(bill, key) {
  const [y, m] = key.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(Math.max(1, Number(bill.dayOfMonth) || 1), lastDay);
  return new Date(y, m - 1, day, 12);
}

/**
 * The first month a new bill posts in. A bill whose day already passed this
 * month starts next month (she may have typed this month's by hand), unless
 * she asks for this month's to be posted too.
 */
export function firstMonthFor(dayOfMonth, { includeThisMonth = false } = {}, now = new Date()) {
  const current = monthKey(now);
  if (includeThisMonth) return current;
  return dueDateIn({ dayOfMonth }, current) > now ? current : addMonths(current, 1);
}

/** Months whose due date has arrived but that were never posted (catches up after time away, up to a year). */
export function pendingPostings(bills, now = new Date(), maxMonths = 12) {
  const current = monthKey(now);
  const floor = addMonths(current, -(maxMonths - 1));
  const out = [];
  bills.forEach((bill) => {
    if (bill.active === false || !bill.startMonth) return;
    let key = bill.lastPostedMonth ? addMonths(bill.lastPostedMonth, 1) : bill.startMonth;
    if (key < bill.startMonth) key = bill.startMonth;
    if (key < floor) key = floor;
    while (key <= current) {
      const date = dueDateIn(bill, key);
      if (date > now) break;
      out.push({ bill, month: key, date });
      key = addMonths(key, 1);
    }
  });
  return out;
}

/** The transaction a bill produces for one month. The id is deterministic, so posting twice (two devices) can't duplicate it. */
export function transactionFromBill(bill, month, date) {
  const isIncome = bill.type === 'income';
  const amount = Math.abs(Number(bill.amount) || 0);
  return {
    id: `rec-${bill.id}-${month}`,
    data: {
      description: bill.name,
      category: isIncome ? 'Entrada' : bill.category || 'Outros',
      type: isIncome ? 'income' : 'expense',
      amount: isIncome ? amount : -amount,
      date: date.toISOString(),
      recurringBillId: bill.id,
      recurringMonth: month,
      source: 'recurring',
    },
  };
}

export function nextDueDate(bill, now = new Date()) {
  let key = monthKey(now);
  if (key < bill.startMonth) key = bill.startMonth;
  let date = dueDateIn(bill, key);
  if (date <= now || (bill.lastPostedMonth && bill.lastPostedMonth >= key)) {
    key = addMonths(key, 1);
    date = dueDateIn(bill, key);
  }
  return date;
}

/** When resuming a paused bill, skip the months it was paused instead of posting them all at once. */
export function resumedLastPosted(bill, now = new Date()) {
  const previous = addMonths(monthKey(now), -1);
  return bill.lastPostedMonth && bill.lastPostedMonth > previous ? bill.lastPostedMonth : previous;
}

export function monthlyTotals(bills) {
  return bills
    .filter((b) => b.active !== false)
    .reduce(
      (acc, b) => {
        const amount = Math.abs(Number(b.amount) || 0);
        if (b.type === 'income') acc.income += amount;
        else acc.expense += amount;
        return acc;
      },
      { expense: 0, income: 0 }
    );
}
