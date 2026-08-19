// Copilot client. The actual AI call happens server-side (see
// server/services/aiService.js) so the API key never reaches the browser.
// If the backend isn't running/configured, this falls back to a local
// rule-based responder clearly marked as demo mode — never a fake network
// call pretending to be a real model.

import { evaluatePurchase, monthlyGoalContribution } from './financeService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

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

function localFallback(message, context) {
  const q = message.toLowerCase();
  const { available = 0, goals = [], monthlyIncome = 0, dailyBudget: budget = 0 } = context ?? {};

  if (q.includes('posso comprar')) {
    const priceMatch = message.match(/(\d+[.,]?\d*)/);
    const price = priceMatch ? Number(priceMatch[1].replace(',', '.')) : 0;
    if (!price) return 'Me diga o valor da compra que eu calculo o impacto no seu orçamento.';
    const result = evaluatePurchase({ price, available, monthlyIncome, goals });
    return `${result.message} Isso atrasaria sua meta em aproximadamente ${result.goalDelayDays} dias.`;
  }

  if (q.includes('onde estou gastando') || q.includes('gastando demais')) {
    return 'Suas maiores categorias este mês são Moradia e Alimentação. Vale revisar assinaturas recorrentes também.';
  }

  if (q.includes('quanto preciso guardar')) {
    const goal = goals[0];
    if (!goal) return 'Você ainda não tem metas ativas. Que tal criar uma?';
    const monthly = monthlyGoalContribution(goal);
    return `Para atingir "${goal.name}" no prazo, guarde cerca de ${monthly.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })} por mês.`;
  }

  if (q.includes('quando atingirei') || q.includes('minha meta')) {
    const goal = goals[0];
    if (!goal) return 'Você ainda não tem metas ativas.';
    return `No ritmo atual, você deve atingir "${goal.name}" perto do prazo definido (${new Date(
      goal.deadline
    ).toLocaleDateString('pt-BR')}).`;
  }

  if (q.includes('daqui a um ano') || q.includes('daqui um ano')) {
    return `Mantendo o padrão atual de economia, sua projeção para os próximos 12 meses é positiva. Veja detalhes na página de Previsão.`;
  }

  if (q.includes('economizar')) {
    return `Você tem ${budget.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })} de orçamento diário. Reduzir pequenos gastos recorrentes (assinaturas, delivery) costuma liberar espaço rápido no orçamento.`;
  }

  return 'Ainda estou em modo demonstração (sem backend de IA configurado). Pergunte sobre compras, metas ou economia e eu farei o meu melhor com os dados disponíveis.';
}
