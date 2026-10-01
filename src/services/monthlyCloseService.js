// The "fechamento do mês" computation: category totals vs the trailing
// average, concrete cut suggestions (real R$ values), small/forgettable
// subscriptions, a one-click-acceptable suggested budget for next month,
// and how much the month advanced/delayed the primary goal. Pure (no
// Firebase, no AI) so it's free to compute and easy to test — an optional
// short narrative on top is generated server-side when AI is configured
// (see server/routes/reports.js), but every number here stands on its own.

import { categorySpendThisMonth, suggestMonthlyBudget } from './budgetService.js';
import { monthlyGoalContribution } from './financeService.js';
import { CATEGORIES } from '../config/categories.js';

function isSameMonth(date, year, month) {
  const d = new Date(date);
  return d.getFullYear() === year && d.getMonth() === month;
}

function monthTotal(transactions, type, now) {
  return transactions
    .filter((t) => t.type === type)
    .filter((t) => isSameMonth(t.date, now.getFullYear(), now.getMonth()))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function monthKeyLabel(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const SMALL_SUBSCRIPTION_LIMIT = 30;
const OVER_AVERAGE_MULTIPLIER = 1.15;

/**
 * @param {{ transactions, subscriptions, categoryBudgets, goals }} data
 * @param {Date} now
 */
export function buildMonthlyClose({ transactions = [], subscriptions = [], goals = [] }, now = new Date()) {
  const income = monthTotal(transactions, 'income', now);
  const expenses = monthTotal(transactions, 'expense', now);
  const netSavings = Math.round((income - expenses) * 100) / 100;

  const categoryTotals = CATEGORIES.map((category) => {
    const amount = categorySpendThisMonth(transactions, category, now);
    const avgPrior = suggestMonthlyBudget(transactions, category, 3, now);
    return { category, amount, avgPrior, diff: Math.round((amount - avgPrior) * 100) / 100 };
  })
    .filter((row) => row.amount > 0 || row.avgPrior > 0)
    .sort((a, b) => b.amount - a.amount);

  const cutSuggestions = categoryTotals
    .filter((row) => row.avgPrior > 0 && row.amount > row.avgPrior * OVER_AVERAGE_MULTIPLIER)
    .map((row) => ({
      category: row.category,
      amount: row.amount,
      avgPrior: row.avgPrior,
      suggestedCut: Math.round((row.amount - row.avgPrior) * 100) / 100,
    }))
    .slice(0, 5);

  const forgottenSubscriptions = subscriptions
    .filter((s) => s.amount > 0 && s.amount < SMALL_SUBSCRIPTION_LIMIT)
    .map((s) => ({ id: s.id, name: s.name, amount: s.amount }));

  const suggestedBudgets = categoryTotals
    .filter((row) => row.avgPrior > 0)
    .reduce((acc, row) => {
      acc[row.category] = row.avgPrior;
      return acc;
    }, {});

  // Primary goal: goals[0] until a priority flag exists (see evaluatePurchase
  // in financeService.js, which has the same limitation today).
  const primaryGoal = goals[0] ?? null;
  let goalPace = null;
  if (primaryGoal) {
    const plannedMonthly = monthlyGoalContribution(primaryGoal);
    const actualContribution = Math.max(0, netSavings);
    const aheadDays = plannedMonthly > 0 ? Math.round(((actualContribution - plannedMonthly) / plannedMonthly) * 30) : 0;
    goalPace = { goalName: primaryGoal.name, plannedMonthly, actualContribution, aheadDays };
  }

  return {
    month: monthKeyLabel(now),
    income,
    expenses,
    netSavings,
    categoryTotals,
    cutSuggestions,
    forgottenSubscriptions,
    suggestedBudgets,
    goalPace,
  };
}
