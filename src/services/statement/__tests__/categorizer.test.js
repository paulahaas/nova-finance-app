import { describe, it, expect } from 'vitest';
import { categorize, UNCATEGORIZED } from '../categorizer';

describe('categorize', () => {
  it('prioritizes a user correction rule over the keyword rules', () => {
    const result = categorize('UBER *TRIP', {
      userRules: [{ pattern: 'UBER', category: 'Compras' }],
    });
    expect(result).toMatchObject({ category: 'Compras', source: 'user-rule', confidence: 1 });
  });

  it('falls back to keyword rules when no user rule matches', () => {
    const result = categorize('UBER *TRIP', { userRules: [{ pattern: 'NETFLIX', category: 'Assinaturas' }] });
    expect(result).toMatchObject({ category: 'Transporte', source: 'keyword-rule' });
  });

  it('falls back to the classifier when no rule matches', () => {
    // "fisioterapia" isn't in any keyword rule, only in the classifier's
    // training data — this exercises tier 3, not tier 2.
    const result = categorize('fisioterapia sessao mensal', { userRules: [] });
    expect(result.source).toBe('classifier');
    expect(result.category).toBe('Saúde');
  });

  it('returns "Não categorizado" when the classifier is disabled and nothing else matches', () => {
    const result = categorize('xyz comercio totalmente desconhecido', { userRules: [], useClassifier: false });
    expect(result).toMatchObject({ category: UNCATEGORIZED, source: 'uncategorized', confidence: 0 });
  });
});
