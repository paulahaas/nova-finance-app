// What was spent on one card, invoice by invoice. The NOVA never sees the
// bank's own invoice: this only adds up what the user registered against the
// card (by chat, "gastei 45 no ifood no nubank", or by statement import), so
// it is an estimate and the page says so. Pure, no Firebase.

import { addMonths, monthKey } from './recurringBillsService.js';

/**
 * The invoice a purchase lands on, named after the month it closes in. With a
 * closing day, a purchase after that day goes to next month's invoice; with
 * none, an invoice is simply the calendar month.
 */
export function invoiceKeyFor(date, closingDay) {
  const key = monthKey(date);
  return closingDay && date.getDate() > closingDay ? addMonths(key, 1) : key;
}

function invoiceView(items, key) {
  const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
  return { key, items: sorted, total: sorted.reduce((sum, t) => sum + Math.abs(t.amount), 0) };
}

/**
 * @returns {{ current, upcoming }} `current` is the open invoice's registered
 * spending; `upcoming` lists the next invoices that already have something on
 * them (installments of a past purchase), up to three ahead.
 */
export function cardInvoiceView(transactions, cardId, now = new Date(), closingDay = null) {
  const mine = transactions.filter((t) => t.cardId === cardId && t.type === 'expense');
  const byInvoice = new Map();
  mine.forEach((t) => {
    const key = invoiceKeyFor(new Date(t.date), closingDay);
    if (!byInvoice.has(key)) byInvoice.set(key, []);
    byInvoice.get(key).push(t);
  });

  const currentKey = invoiceKeyFor(now, closingDay);
  const upcoming = [1, 2, 3]
    .map((n) => addMonths(currentKey, n))
    .filter((key) => byInvoice.has(key))
    .map((key) => invoiceView(byInvoice.get(key), key));

  return { current: invoiceView(byInvoice.get(currentKey) ?? [], currentKey), upcoming };
}
