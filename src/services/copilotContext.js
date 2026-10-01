// Turns the user's real data into the text block the Copilot reads. Pure
// (no Firebase, no browser APIs) so the server can build it from Firestore
// and the tests can build it from fixtures. Every number in here comes from
// the user's own records — the model is told to use nothing else.
import { availableMoney, dailyBudget, daysUntilNextSalary, monthExpenses, monthIncome } from './financeService.js';
import { categoryAnomalies } from './insightsService.js';

const brl = (n) => Number(n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const day = (iso) => (iso ? String(iso).slice(0, 10) : '?');

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function categoryTable(transactions, now, months = 6) {
  const keys = Array.from({ length: months }, (_, i) => monthKey(new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)));
  const byCategory = new Map();
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const key = monthKey(new Date(t.date));
      if (!keys.includes(key)) return;
      if (!byCategory.has(t.category)) byCategory.set(t.category, {});
      const row = byCategory.get(t.category);
      row[key] = (row[key] ?? 0) + Math.abs(t.amount);
    });
  const lines = [...byCategory.entries()]
    .sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0))
    .map(([category, row]) => `- ${category}: ${keys.map((k) => `${k} ${brl(row[k] ?? 0)}`).join(' | ')}`);
  return lines.length ? lines.join('\n') : '(sem gastos registrados)';
}

/**
 * @param {{ user, banks, accounts, cards, transactions, goals, subscriptions }} data
 * @param {Date} now
 */
export function buildCopilotContext(data, now = new Date()) {
  const { user = {}, banks = [], accounts = [], cards = [], transactions = [], goals = [], subscriptions = [] } = data;
  const payDay = user.payDay ?? 5;
  const available = availableMoney({ accounts, cards, subscriptions, goals });
  const income = monthIncome(transactions) || user.income || 0;
  const expenses = monthExpenses(transactions);

  const sections = [];

  sections.push(
    `## Hoje\n${now.toISOString().slice(0, 10)}`,
    [
      '## Perfil',
      `Nome: ${user.name ?? '?'}`,
      `Renda mensal informada: ${brl(user.income)}`,
      `Dia do salário: ${payDay} (faltam ${daysUntilNextSalary(payDay)} dias)`,
      user.aboutMe ? `Sobre ela (escrito por ela mesma): ${user.aboutMe}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    [
      '## Este mês',
      `Entradas: ${brl(income)}`,
      `Saídas: ${brl(expenses)}`,
      `Resultado do mês: ${brl(income - expenses)}`,
      `Dinheiro disponível até o próximo salário: ${brl(available)} (${brl(dailyBudget(available, payDay))} por dia)`,
    ].join('\n'),
    `## Gastos por categoria (últimos 6 meses)\n${categoryTable(transactions, now)}`
  );

  const anomalies = categoryAnomalies(transactions);
  if (anomalies.length) {
    sections.push(
      `## Gastos fora do padrão este mês\n${anomalies
        .map((a) => `- ${a.category}: ${brl(a.currentAmount)} contra média de ${brl(a.averageAmount)} (${a.percentAbove}% acima)`)
        .join('\n')}`
    );
  }

  const bankName = (id) => banks.find((b) => b.id === id)?.name ?? '';
  sections.push(
    `## Contas\n${
      accounts.length
        ? accounts.map((a) => `- ${bankName(a.bankId) || a.name}: saldo ${brl(a.balance)}`).join('\n')
        : '(nenhuma conta com saldo cadastrada)'
    }`,
    `## Cartões\n${
      cards.length
        ? cards
            .map(
              (c) =>
                `- ${c.name} (${c.type === 'debit' ? 'débito' : 'crédito'}${c.last4 ? `, final ${c.last4}` : ''}): limite ${brl(c.limit)}, fatura atual ${brl(c.currentInvoice)}, próxima fatura ${brl(c.nextInvoice)}${c.dueDay ? `, vence dia ${c.dueDay}` : ''}`
            )
            .join('\n')
        : '(nenhum cartão cadastrado)'
    }`,
    `## Assinaturas\n${
      subscriptions.length
        ? subscriptions.map((s) => `- ${s.name}: ${brl(s.amount)} por mês`).join('\n')
        : '(nenhuma assinatura cadastrada)'
    }`,
    `## Metas\n${
      goals.length
        ? [...goals]
            .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
            .map((g) => {
              const total = (g.phase1Target || 0) + (g.phase2Target || 0) || g.target;
              const phase = g.phase1Target && g.saved < g.phase1Target ? ' (fase 1: ida e sustento)' : g.phase1Target ? ' (fase 2: trazer de volta)' : '';
              const country = g.countries?.find((c) => c.id === g.selectedCountryId);
              return `- ${g.priority ? '⭐ PRIORIDADE — ' : ''}${g.name}${phase}: guardado ${brl(g.saved)} de ${brl(total)}, prazo ${day(g.deadline)}${g.monthlyContribution ? `, plano de guardar ${brl(g.monthlyContribution)} por mês` : ''}${country ? `, destino escolhido: ${country.name}` : ''}`;
            })
            .join('\n')
        : '(nenhuma meta cadastrada)'
    }`
  );

  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 40);
  sections.push(
    `## Últimas transações (até 40, da mais recente para a mais antiga)\n${
      recent.length
        ? recent.map((t) => `- ${day(t.date)} | ${t.description} | ${t.category} | ${t.type === 'income' ? '+' : '-'}${brl(Math.abs(t.amount))}`).join('\n')
        : '(nenhuma transação registrada)'
    }`
  );

  return sections.join('\n\n');
}
