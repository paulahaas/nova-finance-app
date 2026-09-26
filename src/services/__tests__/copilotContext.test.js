import { describe, it, expect } from 'vitest';
import { buildCopilotContext } from '../copilotContext';

const now = new Date(2026, 8, 20); // 2026-09-20

const iso = (y, m, d) => new Date(y, m, d, 12).toISOString();

const data = {
  user: { name: 'Paula', income: 1000, payDay: 5, aboutMe: 'Quero fazer intercâmbio em 2027.' },
  banks: [{ id: 'b1', name: 'Nubank' }],
  accounts: [{ id: 'a1', bankId: 'b1', name: 'Conta', balance: 800 }],
  cards: [{ name: 'Nubank', type: 'both', limit: 2000, currentInvoice: 300, nextInvoice: 100, dueDay: 10, last4: '4521' }],
  subscriptions: [{ name: 'Netflix', amount: 39.9 }],
  goals: [{ name: 'Intercâmbio', saved: 1000, target: 20000, deadline: '2027-05-01', monthlyContribution: 500 }],
  transactions: [
    { id: 't1', description: 'iFood', category: 'Alimentação', amount: -45, type: 'expense', date: iso(2026, 8, 18) },
    { id: 't2', description: 'Salário', category: 'Entrada', amount: 1000, type: 'income', date: iso(2026, 8, 5) },
    { id: 't3', description: 'Mercado', category: 'Alimentação', amount: -200, type: 'expense', date: iso(2026, 7, 10) },
  ],
};

describe('buildCopilotContext', () => {
  const text = buildCopilotContext(data, now);

  it('includes the profile, the goal and what she wrote about herself', () => {
    expect(text).toContain('Nome: Paula');
    expect(text).toContain('Quero fazer intercâmbio em 2027.');
    expect(text).toContain('Intercâmbio: guardado');
    expect(text).toContain('prazo 2027-05-01');
  });

  it('lists cards, subscriptions and recent transactions from the real records', () => {
    expect(text).toContain('final 4521');
    expect(text).toContain('Netflix');
    expect(text).toContain('iFood');
    expect(text).toContain('2026-09-18');
  });

  it('builds the per-category monthly table', () => {
    expect(text).toContain('Alimentação: ');
    expect(text).toContain('2026-08');
    expect(text).toContain('2026-09');
  });

  it('says so explicitly when there is no data instead of leaving gaps', () => {
    const empty = buildCopilotContext({ user: { name: 'Paula' } }, now);
    expect(empty).toContain('(nenhuma transação registrada)');
    expect(empty).toContain('(nenhum cartão cadastrado)');
    expect(empty).toContain('(nenhuma meta cadastrada)');
  });
});
