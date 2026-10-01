// Pure helpers for per-category monthly budgets — spend-so-far this month,
// a suggested limit from recent history, and the 80%/100% status used to
// color the progress bar.

function isSameMonth(date, year, month) {
  const d = new Date(date);
  return d.getFullYear() === year && d.getMonth() === month;
}

export function categorySpendThisMonth(transactions, category, now = new Date()) {
  return transactions
    .filter((t) => t.type === 'expense' && t.category === category)
    .filter((t) => isSameMonth(t.date, now.getFullYear(), now.getMonth()))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/** Average of the trailing `months` (months with no spend in that category
 * don't count against the average — a suggestion, not a penalty). */
export function suggestMonthlyBudget(transactions, category, months = 3, now = new Date()) {
  const totals = [];
  for (let i = 1; i <= months; i++) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const total = transactions
      .filter((t) => t.type === 'expense' && t.category === category)
      .filter((t) => isSameMonth(t.date, target.getFullYear(), target.getMonth()))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    if (total > 0) totals.push(total);
  }
  if (!totals.length) return 0;
  return Math.round((totals.reduce((s, v) => s + v, 0) / totals.length) * 100) / 100;
}

/**
 * @returns {{ pct: number, level: 'none'|'ok'|'warning'|'over' }} pct is
 * uncapped (can exceed 100) so the UI can show "320% do orçamento" rather
 * than silently flattening at 100.
 */
export function budgetStatus(spent, limit) {
  if (!limit || limit <= 0) return { pct: 0, level: 'none' };
  const pct = Math.round((spent / limit) * 100);
  let level = 'ok';
  if (pct >= 100) level = 'over';
  else if (pct >= 80) level = 'warning';
  return { pct, level };
}
