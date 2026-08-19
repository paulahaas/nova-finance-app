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
