// Copilot client. The actual AI call happens server-side (see
// server/services/aiService.js) so the API key never reaches the browser.
// If the backend isn't running/configured, this falls back to a local
// rule-based responder — for this project that's not just a fallback, it's
// the everyday path (no paid API key wired up), so it pulls from the
// user's real data and varies its phrasing instead of reading like a
// canned demo.

import { evaluatePurchase, monthlyGoalContribution } from './financeService';
import { topExpenseCategory } from './insightsService';
import { formatCurrency } from '../utils/format';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const GREETINGS = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eae', 'e ai', 'e aí'];

export async function askCopilot({ message, context }) {
  try {
    const res = await fetch(`${API_URL}/api/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });
    if (!res.ok) throw new Error('backend unavailable');
    const data = await res.json();
    return { reply: data.reply, source: 'backend' };
  } catch {
    return { reply: localFallback(message, context), source: 'demo' };
  }
}

function pick(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function localFallback(message, context) {
  const q = message.toLowerCase().trim();
  const {
    available = 0,
    goals = [],
    monthlyIncome = 0,
    monthExpenses = 0,
    dailyBudget: budget = 0,
    transactions = [],
    cards = [],
    subscriptions = [],
  } = context ?? {};

  if (GREETINGS.some((g) => q === g || q.startsWith(`${g} `))) {
    return pick([
      'Oi! Em que posso ajudar com suas finanças hoje?',
      'Olá! Pode perguntar sobre uma compra, suas metas, ou onde está gastando mais.',
      'E aí! Quer saber quanto você tem disponível ou como estão suas metas?',
    ]);
  }

  if (q.includes('posso comprar')) {
    const priceMatch = message.match(/(\d+[.,]?\d*)/);
    const price = priceMatch ? Number(priceMatch[1].replace(',', '.')) : 0;
    if (!price) {
      return pick([
        'Me diga o valor da compra que eu calculo o impacto no seu orçamento.',
        'Quanto custa? Aí eu vejo se cabe até o seu próximo salário.',
      ]);
    }
    const result = evaluatePurchase({ price, available, monthlyIncome, goals });
    return `${result.message} Isso atrasaria sua meta em aproximadamente ${result.goalDelayDays} dias.`;
  }

  if (
    q.includes('onde estou gastando') ||
    q.includes('gastando demais') ||
    q.includes('maior gasto') ||
    q.includes('categoria que mais')
  ) {
    const top = topExpenseCategory(transactions);
    if (!top) return 'Ainda não tenho transações suficientes pra te dizer isso — adiciona alguns gastos primeiro.';
    return `Sua maior categoria de gasto é ${top.category}, com ${formatCurrency(top.amount)} até agora. Vale revisar se dá pra cortar algo ali.`;
  }

  if (q.includes('quanto preciso guardar') || q.includes('quanto guardar') || q.includes('quanto tenho que guardar')) {
    const goal = goals[0];
    if (!goal) return 'Você ainda não tem metas ativas. Que tal criar uma?';
    const monthly = monthlyGoalContribution(goal);
    return `Para atingir "${goal.name}" no prazo, guarde cerca de ${formatCurrency(monthly)} por mês.`;
  }

  if (q.includes('quando atingirei') || q.includes('quando bato') || q.includes('minha meta')) {
    const goal = goals[0];
    if (!goal) return 'Você ainda não tem metas ativas.';
    return `No ritmo atual, você deve atingir "${goal.name}" perto do prazo definido (${new Date(
      goal.deadline
    ).toLocaleDateString('pt-BR')}).`;
  }

  if (q.includes('daqui a um ano') || q.includes('daqui um ano') || q.includes('futuro')) {
    return 'Mantendo o padrão atual de economia, sua projeção para os próximos 12 meses é positiva. Veja detalhes na página de Previsão.';
  }

  if (q.includes('economizar') || q.includes('economia')) {
    return `Você tem ${formatCurrency(budget)} de orçamento diário. Reduzir pequenos gastos recorrentes (assinaturas, delivery) costuma liberar espaço rápido.`;
  }

  if (q.includes('fatura') || q.includes('cartão') || q.includes('cartao')) {
    if (cards.length === 0) return 'Você ainda não tem cartões cadastrados — adiciona um em Cartões.';
    const totalInvoice = cards.reduce((s, c) => s + (c.currentInvoice || 0), 0);
    return `Suas faturas atuais somam ${formatCurrency(totalInvoice)}. Dá uma olhada em Cartões pra ver o detalhe de cada uma.`;
  }

  if (q.includes('assinatura')) {
    if (subscriptions.length === 0) return 'Você não tem assinaturas cadastradas ainda.';
    const total = subscriptions.reduce((s, x) => s + x.amount, 0);
    return `Suas assinaturas somam ${formatCurrency(total)} por mês (${formatCurrency(total * 12)} no ano). Vale conferir se todas ainda valem a pena.`;
  }

  if (q.includes('resumo') || q.includes('como estou') || q.includes('situação') || q.includes('situacao')) {
    const balance = monthlyIncome && monthExpenses !== undefined ? monthlyIncome - monthExpenses : null;
    return `Este mês: ${formatCurrency(monthlyIncome)} de entrada, ${formatCurrency(monthExpenses)} de gastos${
      balance !== null ? `, sobrando ${formatCurrency(balance)}` : ''
    }. Você pode gastar ${formatCurrency(available)} até o próximo salário.`;
  }

  if (q.includes('dica') || q.includes('conselho')) {
    return pick([
      'Uma boa regra: sempre que uma assinatura passar 3 meses sem uso de verdade, cancela.',
      'Revisar a maior categoria de gasto uma vez por semana costuma render mais economia do que cortar tudo de uma vez.',
      'Guardar uma parte da renda assim que ela cai (antes de gastar) funciona melhor do que tentar guardar o que sobra no fim do mês.',
    ]);
  }

  return pick([
    'Posso te ajudar com compras, metas, gastos por categoria, faturas ou assinaturas — pergunta à vontade.',
    'Respondo com os dados que você já tem no NOVA. Tenta perguntar sobre uma compra, uma meta, ou onde está gastando mais.',
    'Não captei essa — tenta algo como "posso comprar um notebook de 3000" ou "quanto preciso guardar pra minha meta".',
  ]);
}
