// Real, in-app-only alerts (no push notifications — decided explicitly):
// budget 80%/100% warnings, a card invoice closing high, small recurring
// charges that are easy to forget, and a short weekly spend summary. Pure
// and derived only from the user's own data, same spirit as insightsService.

import { budgetStatus, categorySpendThisMonth } from './budgetService.js';

const brl = (n) => Number(n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SMALL_SUBSCRIPTION_LIMIT = 30;
const SUBSCRIPTION_REVIEW_DAYS = 60;
const CARD_INVOICE_WARNING_PCT = 70;

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function weekRange(now, weeksAgo) {
  const end = new Date(now);
  end.setDate(end.getDate() - weeksAgo * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

function spendBetween(transactions, start, end) {
  return transactions
    .filter((t) => t.type === 'expense')
    .filter((t) => {
      const d = new Date(t.date);
      return d >= start && d < end;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/** A short "last 7 days vs the 7 days before" recap — the "resumo semanal". */
export function weeklySummary(transactions, now = new Date()) {
  const thisWeek = weekRange(now, 0);
  const lastWeek = weekRange(now, 1);
  const spentThisWeek = spendBetween(transactions, thisWeek.start, thisWeek.end);
  const spentLastWeek = spendBetween(transactions, lastWeek.start, lastWeek.end);
  if (spentThisWeek === 0 && spentLastWeek === 0) return null;

  if (spentLastWeek === 0) {
    return { spentThisWeek, spentLastWeek, message: `Você gastou ${brl(spentThisWeek)} nos últimos 7 dias.` };
  }
  const change = Math.round(((spentThisWeek - spentLastWeek) / spentLastWeek) * 100);
  const message =
    Math.abs(change) < 5
      ? `Você gastou ${brl(spentThisWeek)} nos últimos 7 dias, praticamente igual à semana anterior.`
      : `Você gastou ${brl(spentThisWeek)} nos últimos 7 dias, ${Math.abs(change)}% ${change > 0 ? 'mais' : 'menos'} que na semana anterior.`;
  return { spentThisWeek, spentLastWeek, message };
}

/**
 * @returns {{ id, icon, level: 'over'|'warning'|'info', message }[]}
 * sorted so the most urgent (over budget / over invoice) comes first.
 */
export function buildAlerts({ cards = [], subscriptions = [], categoryBudgets = [], transactions = [] }, now = new Date()) {
  const alerts = [];

  categoryBudgets.forEach((b) => {
    const category = b.category ?? b.id;
    const spent = categorySpendThisMonth(transactions, category, now);
    const status = budgetStatus(spent, b.monthlyLimit);
    if (status.level === 'warning' || status.level === 'over') {
      alerts.push({
        id: `budget-${category}`,
        icon: status.level === 'over' ? '🔴' : '🟡',
        level: status.level,
        message: `${category}: ${status.pct}% do orçamento mensal (${brl(spent)} de ${brl(b.monthlyLimit)}).`,
      });
    }
  });

  cards.forEach((c) => {
    if (!c.limit || c.limit <= 0 || !c.currentInvoice) return;
    const pct = Math.round((c.currentInvoice / c.limit) * 100);
    if (pct >= CARD_INVOICE_WARNING_PCT) {
      alerts.push({
        id: `card-${c.id}`,
        icon: '💳',
        level: pct >= 100 ? 'over' : 'warning',
        message: `A fatura do ${c.name} está em ${brl(c.currentInvoice)}, ${pct}% do limite do cartão.`,
      });
    }
  });

  subscriptions.forEach((s) => {
    if (!s.amount || s.amount >= SMALL_SUBSCRIPTION_LIMIT) return;
    const createdAt = toDate(s.createdAt);
    if (!createdAt) return;
    const daysOld = Math.round((now - createdAt) / 86400000);
    if (daysOld < SUBSCRIPTION_REVIEW_DAYS) return;
    alerts.push({
      id: `sub-${s.id}`,
      icon: '🔁',
      level: 'info',
      message: `Você paga ${brl(s.amount)}/mês em ${s.name} — uma cobrança pequena, fácil de esquecer. Vale revisar se ainda usa.`,
    });
  });

  const weekly = weeklySummary(transactions, now);
  if (weekly) {
    alerts.push({ id: 'weekly-summary', icon: '📅', level: 'info', message: weekly.message });
  }

  const order = { over: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.level] - order[b.level]);
}
