// What was spent on one card, month by month. The NOVA never sees the bank's
// own invoice: this only adds up what the user registered against the card
// (by chat, "gastei 45 no ifood no nubank", or by statement import), so it is
// an estimate and the page says so. Pure, no Firebase.

import { addMonths, monthKey } from './recurringBillsService.js';

function monthView(items, key) {
  const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
  return { key, items: sorted, total: sorted.reduce((sum, t) => sum + Math.abs(t.amount), 0) };
}

/**
 * @returns {{ current, upcoming }} `current` is this month's registered
 * spending on the card; `upcoming` lists the next months that already have
 * something on them (installments of a past purchase), up to three months ahead.
 */
export function cardInvoiceView(transactions, cardId, now = new Date()) {
  const mine = transactions.filter((t) => t.cardId === cardId && t.type === 'expense');
  const byMonth = new Map();
  mine.forEach((t) => {
    const key = monthKey(new Date(t.date));
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(t);
  });

  const currentKey = monthKey(now);
  const upcoming = [1, 2, 3]
    .map((n) => addMonths(currentKey, n))
    .filter((key) => byMonth.has(key))
    .map((key) => monthView(byMonth.get(key), key));

  return { current: monthView(byMonth.get(currentKey) ?? [], currentKey), upcoming };
}
