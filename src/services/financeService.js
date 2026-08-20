// Core financial calculations shared across the Dashboard, "Posso comprar?"
// and Forecast pages. Kept pure (no side effects) so it's easy to unit test
// and reuse from the server for parity if needed later.

import { nextSalaryDate, daysUntil } from '../utils/format';

export function totalBalance(accounts) {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function totalCardCommitment(cards) {
  return cards.reduce((sum, c) => sum + c.currentInvoice, 0);
}

export function totalSubscriptions(subscriptions) {
  return subscriptions.reduce((sum, s) => sum + s.amount, 0);
}

export function monthExpenses(transactions) {
  const now = new Date();
  return transactions
    .filter((t) => t.type === 'expense')
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function monthIncome(transactions) {
  const now = new Date();
  return transactions
    .filter((t) => t.type === 'income')
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * "Dinheiro disponível" — balance minus upcoming committed spend
 * (card invoices, recurring subscriptions) up to the next salary date.
 */
export function availableMoney({ accounts, cards, subscriptions, goals }) {
  const balance = totalBalance(accounts);
  const commitments = totalCardCommitment(cards) + totalSubscriptions(subscriptions);
  const goalReserve = goals.reduce((sum, g) => sum + monthlyGoalContribution(g), 0);
  return Math.max(0, balance - commitments - goalReserve);
}

/**
 * The pace a goal is being funded at. Goals created through the "Nova meta"
 * flow store this once at creation time (see pages/goals/GoalNew.jsx) so it
 * doesn't balloon as the deadline approaches — it's a planned monthly
 * deposit, not a recomputed "amount still owed" figure. Falls back to an
 * even split of the remaining amount for goals that don't have one stored.
 */
export function monthlyGoalContribution(goal) {
  if (typeof goal.monthlyContribution === 'number') return goal.monthlyContribution;
  const remaining = Math.max(0, goal.target - goal.saved);
  const months = Math.max(1, monthsUntil(goal.deadline));
  return remaining / months;
}

export function monthsUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(
    1,
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  );
}

export function daysUntilNextSalary(payDay) {
  return daysUntil(nextSalaryDate(payDay));
}

export function dailyBudget(available, payDay) {
  const days = Math.max(1, daysUntilNextSalary(payDay));
  return available / days;
}

/**
 * "Posso comprar?" heuristic.
 * Returns a verdict (good | caution | bad), a message, and the estimated
 * delay (in days) the purchase would add to the user's active goals.
 */
export function evaluatePurchase({ price, available, monthlyIncome, goals }) {
  const ratio = monthlyIncome > 0 ? price / monthlyIncome : 1;
  const remainingAfter = available - price;

  let verdict = 'good';
  let message = 'Essa compra cabe confortavelmente no seu orçamento atual.';

  if (remainingAfter < 0) {
    verdict = 'bad';
    message = 'Essa compra ultrapassa o dinheiro disponível até seu próximo salário.';
  } else if (ratio > 0.5 || remainingAfter < available * 0.15) {
    verdict = 'caution';
    message = 'Essa compra reduzirá bastante sua capacidade de economizar este mês.';
  }

  const primaryGoal = goals[0];
  let goalDelayDays = 0;
  if (primaryGoal) {
    const monthlyRate = monthlyGoalContribution(primaryGoal) || 1;
    goalDelayDays = Math.round((price / monthlyRate) * 30);
  }

  return { verdict, message, goalDelayDays, remainingAfter };
}

/**
 * "NOVA Pulse" — a one-glance financial status for the mobile Home
 * hierarchy (spec section 3). Deliberately coarse (3 levels): it's meant
 * to be read in half a second, not analyzed.
 */
export function pulseStatus({ available, monthlyIncome }) {
  const ratio = monthlyIncome > 0 ? available / monthlyIncome : 0;
  if (ratio > 0.3) {
    return { level: 'good', label: 'Saudável', message: 'Suas finanças estão equilibradas este mês.' };
  }
  if (ratio > 0.1) {
    return { level: 'caution', label: 'Atenção', message: 'Fique de olho nos gastos até o próximo salário.' };
  }
  return { level: 'alert', label: 'Alerta', message: 'Seu orçamento está apertado este mês.' };
}

/**
 * Simple linear forecast based on average of the last 3 months of
 * income/expense, projected forward. Advanced (Pro) forecasts would layer
 * seasonality/behavioral signals on top of this baseline.
 */
export function forecastBalance({ currentBalance, avgMonthlyIncome, avgMonthlyExpense, months }) {
  const net = avgMonthlyIncome - avgMonthlyExpense;
  const points = [];
  for (let i = 1; i <= months; i++) {
    points.push({ month: i, balance: Math.round((currentBalance + net * i) * 100) / 100 });
  }
  return points;
}

/**
 * A single 0-100 "Financial Score" (spec section 18) combining savings
 * rate, how much of income goes to recurring commitments, goal progress,
 * and any open spending anomalies. Weighted, not scientific — meant to be
 * a fast at-a-glance signal, same spirit as pulseStatus() above.
 */
export function financialScore({
  monthIncome,
  monthExpenses,
  subscriptionsTotal = 0,
  anomalyCount = 0,
  goalsOnTrackRatio = 1,
}) {
  const savingsRate = monthIncome > 0 ? (monthIncome - monthExpenses) / monthIncome : 0;
  const savingsScore = clamp01(savingsRate / 0.2); // saving 20%+ of income = full marks

  const subscriptionBurden = monthIncome > 0 ? subscriptionsTotal / monthIncome : 0;
  const subscriptionScore = clamp01(1 - subscriptionBurden / 0.3); // >30% of income on subs = 0

  const anomalyScore = clamp01(1 - anomalyCount / 3);

  const weighted =
    savingsScore * 0.45 + subscriptionScore * 0.2 + clamp01(goalsOnTrackRatio) * 0.2 + anomalyScore * 0.15;

  const score = Math.round(weighted * 100);

  let label = 'Precisa de atenção';
  let tone = 'alert';
  if (score >= 75) {
    label = 'Saudável';
    tone = 'good';
  } else if (score >= 45) {
    label = 'Estável';
    tone = 'caution';
  }

  return { score, label, tone };
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}
