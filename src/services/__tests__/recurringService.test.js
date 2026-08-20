import { describe, it, expect } from 'vitest';
import { detectRecurring } from '../recurringService';

function monthlyCharges({ description, amount, category, months = 4, bankId = 'bank-1' }) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 13);
    return {
      id: `${description}-${i}`,
      bankId,
      description,
      category,
      amount,
      type: 'expense',
      date: d.toISOString(),
    };
  });
}

describe('detectRecurring', () => {
  it('detects a stable monthly subscription', () => {
    const transactions = monthlyCharges({ description: 'NETFLIX', amount: -39.9, category: 'Assinaturas' });
    const patterns = detectRecurring(transactions);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({ description: 'NETFLIX', frequency: 'monthly' });
    expect(patterns[0].confidence).toBeGreaterThan(0.5);
  });

  it('ignores merchants seen fewer times than minOccurrences', () => {
    const transactions = monthlyCharges({ description: 'CINEMA', amount: -58, category: 'Entretenimento', months: 2 });
    expect(detectRecurring(transactions)).toHaveLength(0);
  });

  it('ignores irregular one-off purchases even from the same merchant', () => {
    const now = new Date();
    const transactions = [
      { id: 't1', bankId: 'bank-1', description: 'AMAZON', category: 'Compras', amount: -19.9, type: 'expense', date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() },
      { id: 't2', bankId: 'bank-1', description: 'AMAZON', category: 'Compras', amount: -85, type: 'expense', date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString() },
      { id: 't3', bankId: 'bank-1', description: 'AMAZON', category: 'Compras', amount: -12.5, type: 'expense', date: new Date(now.getFullYear(), now.getMonth(), 20).toISOString() },
    ];
    expect(detectRecurring(transactions)).toHaveLength(0);
  });

  it('ignores income', () => {
    const transactions = monthlyCharges({ description: 'SALARIO', amount: 4000, category: 'Entrada' }).map((t) => ({
      ...t,
      type: 'income',
    }));
    expect(detectRecurring(transactions)).toHaveLength(0);
  });
});
