// The evening phone notification: a nudge to log today's spending (only if
// nothing was logged today), plus whatever deserves attention: budgets near or
// over their limit, a card invoice closing high, a fixed bill landing tomorrow,
// and on Mondays the weekly summary. One digest per day, and each alert only
// once (a budget that stays over limit doesn't buzz every night). Pure, no
// Firebase.

import { buildAlerts } from './alertsService.js';
import { nextDueDate, monthKey } from './recurringBillsService.js';

const brl = (n) => Number(n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const isoDay = (d) => `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;

const LOG_NUDGE_ID = 'log-today';

// Day a transaction belongs to in Brasília time (UTC-3). Date-only strings are
// already a calendar day.
const BR_OFFSET_MS = 3 * 60 * 60 * 1000;
function brDay(date) {
  if (typeof date === 'string' && date.length === 10) return date;
  return new Date(Date.parse(date) - BR_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * @param {object} data cards, subscriptions, categoryBudgets, transactions, recurringBills
 * @param {Record<string,string>} sentState alert id -> the day it was last notified
 * @returns {{ payload: {title, body, url}|null, sent: Record<string,string> }} `sent` is what to remember
 */
export function buildDigest({ cards = [], subscriptions = [], categoryBudgets = [], transactions = [], recurringBills = [] }, sentState = {}, now = new Date()) {
  const today = isoDay(now);
  const month = monthKey(now);
  const items = [];

  buildAlerts({ cards, subscriptions, categoryBudgets, transactions }, now).forEach((a) => {
    const urgent = a.level === 'over' || a.level === 'warning';
    const weekly = a.id === 'weekly-summary' && now.getDay() === 1;
    if (!urgent && !weekly) return;
    items.push({ id: a.id, message: a.message, key: weekly ? today : month });
  });

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  recurringBills
    .filter((b) => b.active !== false && b.startMonth)
    .forEach((bill) => {
      const due = nextDueDate(bill, now);
      if (isoDay(due) !== isoDay(tomorrow)) return;
      items.push({
        id: `bill-${bill.id}`,
        message: bill.type === 'income' ? `Amanhã entra ${bill.name}: ${brl(bill.amount)}.` : `Amanhã o NOVA lança ${bill.name}: ${brl(bill.amount)}.`,
        key: isoDay(due),
      });
    });

  const fresh = items.filter((i) => sentState[i.id] !== i.key);
  const loggedToday = transactions.some((tx) => tx.date && brDay(tx.date) === today);
  const nudge = !loggedToday && sentState[LOG_NUDGE_ID] !== today;
  if (fresh.length === 0 && !nudge) return { payload: null, sent: {} };

  const sent = Object.fromEntries(fresh.map((i) => [i.id, i.key]));
  if (nudge) sent[LOG_NUDGE_ID] = today;

  if (fresh.length === 0) {
    return { payload: { title: 'NOVA', body: 'Já anotou os gastos de hoje? Leva 10 segundos, antes que você esqueça.', url: '/app' }, sent };
  }
  const extra = fresh.length - 1;
  const body = fresh[0].message + (extra > 0 ? ` (+${extra} aviso${extra > 1 ? 's' : ''})` : '') + (nudge ? ' Anote também os gastos de hoje.' : '');
  return { payload: { title: 'NOVA', body, url: '/app/alerts' }, sent };
}
