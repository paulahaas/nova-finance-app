import { describe, it, expect } from 'vitest';
import { applyKeywordRules } from '../rules';
import { normalizeDescription } from '../normalizer';

describe('applyKeywordRules', () => {
  it('matches known delivery merchants to Alimentação', () => {
    expect(applyKeywordRules(normalizeDescription('IFOOD *PEDIDO 123'))).toMatchObject({ category: 'Alimentação' });
    expect(applyKeywordRules(normalizeDescription('UBER EATS'))).toMatchObject({ category: 'Alimentação' });
  });

  it('matches Uber rides to Transporte, not Alimentação', () => {
    expect(applyKeywordRules(normalizeDescription('UBER *TRIP'))).toMatchObject({ category: 'Transporte' });
  });

  it('matches subscription services to Assinaturas', () => {
    expect(applyKeywordRules(normalizeDescription('NETFLIX.COM'))).toMatchObject({ category: 'Assinaturas' });
    expect(applyKeywordRules(normalizeDescription('SPOTIFY'))).toMatchObject({ category: 'Assinaturas' });
  });

  it('returns null for unrecognized text', () => {
    expect(applyKeywordRules(normalizeDescription('XYZ COMERCIO LTDA'))).toBeNull();
  });

  it('prefers the more specific keyword when one contains another', () => {
    // "MERCADO" (-> Alimentação) is a substring of "MERCADO LIVRE" (-> Compras) —
    // the longer, more specific match must win, not whichever rule comes first.
    expect(applyKeywordRules(normalizeDescription('MERCADO LIVRE COMPRA'))).toMatchObject({ category: 'Compras' });
    expect(applyKeywordRules(normalizeDescription('SUPERMERCADO BOM PRECO'))).toMatchObject({ category: 'Alimentação' });
  });
});
