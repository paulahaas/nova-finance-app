import { describe, it, expect } from 'vitest';
import { hashString, transactionDedupeKey } from '../hash';

describe('hashString', () => {
  it('is deterministic', () => {
    expect(hashString('IFOOD')).toBe(hashString('IFOOD'));
  });

  it('differs for different input', () => {
    expect(hashString('IFOOD')).not.toBe(hashString('UBER'));
  });
});

describe('transactionDedupeKey', () => {
  const base = { date: '2026-08-12T00:00:00.000Z', amount: -39.9, description: 'NETFLIX', bankId: 'bank-1' };

  it('is stable for identical transactions', () => {
    expect(transactionDedupeKey(base)).toBe(transactionDedupeKey({ ...base }));
  });

  it('ignores time-of-day within the same date', () => {
    const other = { ...base, date: '2026-08-12T23:59:00.000Z' };
    expect(transactionDedupeKey(base)).toBe(transactionDedupeKey(other));
  });

  it('changes when the amount changes', () => {
    expect(transactionDedupeKey(base)).not.toBe(transactionDedupeKey({ ...base, amount: -40 }));
  });

  it('changes when the bank changes', () => {
    expect(transactionDedupeKey(base)).not.toBe(transactionDedupeKey({ ...base, bankId: 'bank-2' }));
  });
});
