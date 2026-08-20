import { describe, it, expect } from 'vitest';
import { flagDuplicates } from '../duplicateDetector';
import { normalizeDescription } from '../normalizer';

function tx(overrides) {
  return {
    date: '2026-08-12T00:00:00.000Z',
    description: 'AMAZON',
    normalizedDescription: normalizeDescription('AMAZON'),
    amount: -149.9,
    bankId: 'bank-1',
    ...overrides,
  };
}

describe('flagDuplicates', () => {
  it('flags an exact match against existing transactions', () => {
    const [result] = flagDuplicates([tx({})], [tx({ id: 'existing-1' })]);
    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateReason).toBe('existing');
  });

  it('flags a repeated row within the same batch', () => {
    const [first, second] = flagDuplicates([tx({}), tx({})], []);
    expect(first.isDuplicate).toBe(false);
    expect(second.isDuplicate).toBe(true);
    expect(second.duplicateReason).toBe('batch');
  });

  it('flags a near match within the date window even if not byte-identical', () => {
    const existing = tx({ id: 'existing-1', date: '2026-08-10T00:00:00.000Z' });
    const [result] = flagDuplicates([tx({ date: '2026-08-12T00:00:00.000Z' })], [existing]);
    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateReason).toBe('similar');
  });

  it('does not flag genuinely different transactions', () => {
    const existing = tx({ id: 'existing-1', description: 'NETFLIX', normalizedDescription: normalizeDescription('NETFLIX'), amount: -39.9 });
    const [result] = flagDuplicates([tx({})], [existing]);
    expect(result.isDuplicate).toBe(false);
  });
});
