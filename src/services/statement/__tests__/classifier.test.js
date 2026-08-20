import { describe, it, expect } from 'vitest';
import { classify, tokenize, cosineSimilarity } from '../classifier';

describe('tokenize', () => {
  it('drops short tokens and stopwords', () => {
    expect(tokenize('consulta medica de rotina')).toEqual(['CONSULTA', 'MEDICA', 'ROTINA']);
  });
});

describe('cosineSimilarity', () => {
  it('is 1 for identical vectors and 0 for disjoint vectors', () => {
    const a = new Map([['x', 1], ['y', 2]]);
    expect(cosineSimilarity(a, a)).toBeCloseTo(1);
    const b = new Map([['z', 1]]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });
});

describe('classify', () => {
  it('classifies a medical-consultation description as Saúde', () => {
    const result = classify('consulta medica particular cardiologista');
    expect(result.category).toBe('Saúde');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('classifies a graduate-course description as Educação', () => {
    const result = classify('matricula pos graduacao mestrado');
    expect(result.category).toBe('Educação');
  });

  it('returns null for text with no usable tokens', () => {
    expect(classify('a e de')).toBeNull();
  });
});
