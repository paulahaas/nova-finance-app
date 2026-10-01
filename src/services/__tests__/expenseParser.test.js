import { describe, it, expect } from 'vitest';
import { parseExpenseMessage, looksLikeExpenseMessage, fromAiExtraction } from '../expenseParser';

const now = new Date(2026, 8, 20, 12); // 2026-09-20

describe('looksLikeExpenseMessage', () => {
  it('accepts messages with a value and rejects plain questions', () => {
    expect(looksLikeExpenseMessage('gastei 45 no ifood')).toBe(true);
    expect(looksLikeExpenseMessage('apaga o último')).toBe(true);
    expect(looksLikeExpenseMessage('quanto gastei esse mês?')).toBe(false);
    expect(looksLikeExpenseMessage('quais são meus maiores gastos?')).toBe(false);
  });
});

describe('parseExpenseMessage — new transactions', () => {
  it('parses "gastei 45 no ifood"', () => {
    const r = parseExpenseMessage('gastei 45 no ifood', { now });
    expect(r.intent).toBe('create');
    expect(r.transaction).toMatchObject({ amount: -45, type: 'expense', category: 'Alimentação' });
    expect(r.transaction.date.slice(0, 10)).toBe('2026-09-20');
  });

  it('parses "uber 18,90 ontem, no nubank" with a card match', () => {
    const cards = [{ id: 'c1', name: 'Nubank', bankId: 'b1' }];
    const r = parseExpenseMessage('uber 18,90 ontem, no nubank', { cards, now });
    expect(r.intent).toBe('create');
    expect(r.transaction.amount).toBeCloseTo(-18.9);
    expect(r.transaction.category).toBe('Transporte');
    expect(r.transaction.cardId).toBe('c1');
    expect(r.transaction.date.slice(0, 10)).toBe('2026-09-19');
  });

  it('parses "tênis 300 em 3x" with installments', () => {
    const r = parseExpenseMessage('tênis 300 em 3x', { now });
    expect(r.intent).toBe('create');
    expect(r.transaction.amount).toBe(-300);
    expect(r.transaction.installmentsTotal).toBe(3);
  });

  it('parses income verbs as positive amounts in the Entrada category', () => {
    const r = parseExpenseMessage('recebi 200 de reembolso', { now });
    expect(r.intent).toBe('create');
    expect(r.transaction).toMatchObject({ amount: 200, type: 'income', category: 'Entrada' });
  });

  it('returns "none" for a plain question with no amount', () => {
    expect(parseExpenseMessage('quanto gastei com uber esse mês?', { now }).intent).toBe('none');
  });
});

describe('parseExpenseMessage — corrections and deletion', () => {
  const recentTransactions = [
    { id: 't1', description: 'Uber', amount: -28.5, type: 'expense', category: 'Transporte', date: '2026-09-18T12:00:00.000Z' },
    { id: 't2', description: 'iFood', amount: -45, type: 'expense', category: 'Alimentação', date: '2026-09-19T12:00:00.000Z' },
  ];

  it('resolves "apaga o último" to the most recent transaction', () => {
    const r = parseExpenseMessage('apaga o último', { recentTransactions, now });
    expect(r.intent).toBe('delete');
    expect(r.transaction.id).toBe('t2');
  });

  it('returns delete_unresolved when there is nothing to delete', () => {
    expect(parseExpenseMessage('apaga a última transação', { recentTransactions: [], now }).intent).toBe('delete_unresolved');
  });

  it('resolves "o uber foi 21" to the matching transaction with a patched amount', () => {
    const r = parseExpenseMessage('o uber foi 21', { recentTransactions, now });
    expect(r.intent).toBe('correct');
    expect(r.transaction.id).toBe('t1');
    expect(r.patch.amount).toBe(-21);
  });

  it('resolves a category correction by name match', () => {
    const r = parseExpenseMessage('muda a categoria do ifood pra Compras', { recentTransactions, now });
    expect(r.intent).toBe('correct');
    expect(r.transaction.id).toBe('t2');
    expect(r.patch.category).toBe('Compras');
  });

  it('flags an unresolved correction when no transaction matches the hint', () => {
    const r = parseExpenseMessage('o mercado foi 50', { recentTransactions: [], now });
    expect(r.intent).toBe('correct_unresolved');
  });
});

describe('fromAiExtraction', () => {
  const recentTransactions = [
    { id: 't1', description: 'Uber', amount: -28.5, type: 'expense', category: 'Transporte', date: '2026-09-18T12:00:00.000Z' },
  ];

  it('builds a create transaction from the AI JSON, validating the category', () => {
    const json = { intent: 'create', description: 'iFood', amount: 45, type: 'expense', date: 'hoje', category: 'Alimentação', installments: null };
    const r = fromAiExtraction(json, { now });
    expect(r.intent).toBe('create');
    expect(r.transaction).toMatchObject({ description: 'iFood', amount: -45, category: 'Alimentação', categorySource: 'ai' });
  });

  it('falls back to the deterministic classifier when the AI category is not one of the ten', () => {
    const json = { intent: 'create', description: 'fisioterapia sessao', amount: 120, type: 'expense', date: 'hoje', category: 'inventada' };
    const r = fromAiExtraction(json, { now });
    expect(r.transaction.category).toBe('Saúde');
    expect(r.transaction.categorySource).not.toBe('ai');
  });

  it('rejects a non-positive or missing amount instead of trusting it blindly', () => {
    expect(fromAiExtraction({ intent: 'create', amount: 0 }, { now }).intent).toBe('none');
    expect(fromAiExtraction({ intent: 'create', amount: -5 }, { now }).intent).toBe('none');
    expect(fromAiExtraction({ intent: 'create' }, { now }).intent).toBe('none');
  });

  it('resolves delete/correct the same way the regex path does', () => {
    const del = fromAiExtraction({ intent: 'delete', targetHint: 'uber' }, { recentTransactions, now });
    expect(del).toMatchObject({ intent: 'delete', transaction: { id: 't1' } });

    const corr = fromAiExtraction({ intent: 'correct', targetHint: 'uber', patchAmount: 21 }, { recentTransactions, now });
    expect(corr).toMatchObject({ intent: 'correct', transaction: { id: 't1' }, patch: { amount: -21 } });
  });

  it('returns none for malformed or null input instead of throwing', () => {
    expect(fromAiExtraction(null, { now }).intent).toBe('none');
    expect(fromAiExtraction({ intent: 'chit-chat' }, { now }).intent).toBe('none');
  });
});
