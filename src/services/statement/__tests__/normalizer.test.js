import { describe, it, expect } from 'vitest';
import { normalizeDescription, parseStatementDate, parseStatementAmount, normalizeTransactionRow } from '../normalizer';

describe('normalizeDescription', () => {
  it('strips order-id noise and accents, upper-cases', () => {
    expect(normalizeDescription('ifood *pedido 123456')).toBe('IFOOD');
    expect(normalizeDescription('  Uber   *Trip  ')).toBe('UBER');
    expect(normalizeDescription('Padaria do Bairro Ção')).toBe('PADARIA DO BAIRRO CAO');
  });
});

describe('parseStatementDate', () => {
  it('parses BR dd/mm/yyyy', () => {
    const iso = parseStatementDate('12/08/2026');
    expect(iso.slice(0, 10)).toBe('2026-08-12');
  });

  it('parses ISO yyyy-mm-dd', () => {
    const iso = parseStatementDate('2026-08-12');
    expect(iso.slice(0, 10)).toBe('2026-08-12');
  });

  it('parses 2-digit year as 20xx', () => {
    const iso = parseStatementDate('01/01/26');
    expect(iso.slice(0, 10)).toBe('2026-01-01');
  });

  it('returns null for garbage', () => {
    expect(parseStatementDate('not a date')).toBeNull();
    expect(parseStatementDate('')).toBeNull();
  });
});

describe('parseStatementAmount', () => {
  it('parses BR decimal comma with thousands dot', () => {
    expect(parseStatementAmount('1.234,56')).toBeCloseTo(1234.56);
  });

  it('parses plain decimal point', () => {
    expect(parseStatementAmount('-45.90')).toBeCloseTo(-45.9);
  });

  it('parses parenthesized as negative', () => {
    expect(parseStatementAmount('(120,00)')).toBeCloseTo(-120);
  });

  it('parses positive without sign', () => {
    expect(parseStatementAmount('39,90')).toBeCloseTo(39.9);
  });
});

describe('normalizeTransactionRow', () => {
  it('builds a normalized row from a single amount column', () => {
    const row = normalizeTransactionRow({ date: '12/08/2026', description: 'NETFLIX', amount: '-39,90' });
    expect(row).toMatchObject({ description: 'NETFLIX', amount: -39.9, type: 'expense' });
    expect(row.date.slice(0, 10)).toBe('2026-08-12');
  });

  it('builds a normalized row from debit/credit columns', () => {
    const row = normalizeTransactionRow({ date: '12/08/2026', description: 'Salário', debit: '', credit: '4000,00' });
    expect(row.amount).toBeCloseTo(4000);
    expect(row.type).toBe('income');
  });

  it('returns null when date or description is missing', () => {
    expect(normalizeTransactionRow({ date: '', description: 'x', amount: '10' })).toBeNull();
    expect(normalizeTransactionRow({ date: '12/08/2026', description: '', amount: '10' })).toBeNull();
  });

  it('returns null for a zero amount', () => {
    expect(normalizeTransactionRow({ date: '12/08/2026', description: 'x', amount: '0' })).toBeNull();
  });
});
