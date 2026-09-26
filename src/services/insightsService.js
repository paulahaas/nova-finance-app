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

function monthTotal(transactions, type, monthsAgo) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return transactions
    .filter((t) => t.type === type)
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Real insights for the Insights screen, derived only from the user's own
 * data — every sentence here can be traced back to transactions or
 * subscriptions. Returns [] when there is nothing to say yet.
 */
export function buildInsights({ transactions = [], subscriptions = [] }) {
  const insights = [];

  const spentNow = monthTotal(transactions, 'expense', 0);
  const spentBefore = monthTotal(transactions, 'expense', 1);
  if (spentBefore > 0 && spentNow > 0) {
    const change = Math.round(((spentNow - spentBefore) / spentBefore) * 100);
    if (Math.abs(change) >= 5) {
      insights.push({
        icon: change > 0 ? '📈' : '📉',
        text: `Seus gastos deste mês estão ${Math.abs(change)}% ${change > 0 ? 'acima' : 'abaixo'} do mês passado (${brl(spentNow)} contra ${brl(spentBefore)}).`,
      });
    }
  }

  const incomeNow = monthTotal(transactions, 'income', 0);
  if (incomeNow > 0) {
    const saved = incomeNow - spentNow;
    const rate = Math.round((saved / incomeNow) * 100);
    insights.push({
      icon: saved >= 0 ? '💰' : '⚠️',
      text:
        saved >= 0
          ? `Você está guardando ${rate}% da renda deste mês (${brl(saved)}).`
          : `Você já gastou ${brl(-saved)} a mais do que entrou neste mês.`,
    });
  }

  const now = new Date();
  const thisMonthExpenses = transactions.filter((t) => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const top = topExpenseCategory(thisMonthExpenses);
  if (top) {
    insights.push({ icon: '🏷️', text: `Seu maior gasto deste mês é ${top.category}: ${brl(top.amount)}.` });
  }

  categoryAnomalies(transactions).forEach((a) => {
    insights.push({
      icon: '🔍',
      text: `${a.category} está ${a.percentAbove}% acima da sua média (${brl(a.currentAmount)} contra ${brl(a.averageAmount)} de costume) — vale a pena verificar.`,
    });
  });

  const subsTotal = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  if (subsTotal > 0) {
    insights.push({
      icon: '🔁',
      text: `Suas assinaturas somam ${brl(subsTotal)} por mês, ${brl(subsTotal * 12)} por ano.`,
    });
  }

  return insights;
}
