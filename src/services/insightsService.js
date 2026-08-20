// Small, pure helpers that turn raw transactions into a one-line insight —
// used for the "last recommendation" teaser on the mobile Home (spec
// section 3). Real, persisted Copilot recommendations are a backend job
// for later (see README roadmap); this keeps the teaser honest by
// deriving it from data that actually exists.

export function topExpenseCategory(transactions) {
  const totals = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      totals[t.category] = (totals[t.category] ?? 0) + Math.abs(t.amount);
    });
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return entries[0] ? { category: entries[0][0], amount: entries[0][1] } : null;
}

export function primaryRecommendation(transactions) {
  const top = topExpenseCategory(transactions);
  if (!top) return 'Adicione algumas transações para eu começar a te dar recomendações.';
  return `Sua maior categoria de gasto é ${top.category}. Vale revisar se há algo para cortar ali este mês.`;
}

// Flags categories where this month's spend is far above the trailing
// average (spec section 16). Deliberately never says "fraude" — only
// "fora do seu padrão", since a legitimate one-off purchase looks the same
// as an anomaly from pure spend data. A category needs both prior history
// (avgAmount above a small floor) and a real gap (multiplier) to surface,
// so a brand-new category isn't flagged just for having no baseline yet.
export function categoryAnomalies(transactions, { lookbackMonths = 3, multiplier = 1.8 } = {}) {
  const now = new Date();
  const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
  const currentKey = monthKey(now);

  const byCategoryMonth = new Map();
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const d = new Date(t.date);
      const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthsAgo < 0 || monthsAgo > lookbackMonths) return;

      const key = t.category;
      if (!byCategoryMonth.has(key)) byCategoryMonth.set(key, new Map());
      const months = byCategoryMonth.get(key);
      const mk = monthKey(d);
      months.set(mk, (months.get(mk) ?? 0) + Math.abs(t.amount));
    });

  const anomalies = [];
  byCategoryMonth.forEach((months, category) => {
    const currentAmount = months.get(currentKey) ?? 0;
    const priorTotals = [...months.entries()]
      .filter(([mk]) => mk !== currentKey)
      .map(([, total]) => total);
    if (priorTotals.length === 0) return;

    const averageAmount = priorTotals.reduce((s, v) => s + v, 0) / lookbackMonths;
    if (averageAmount < 20 || currentAmount <= averageAmount * multiplier) return;

    anomalies.push({
      category,
      currentAmount,
      averageAmount: Math.round(averageAmount * 100) / 100,
      percentAbove: Math.round(((currentAmount - averageAmount) / averageAmount) * 100),
    });
  });

  return anomalies.sort((a, b) => b.percentAbove - a.percentAbove);
}
