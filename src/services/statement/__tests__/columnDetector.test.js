import { describe, it, expect } from 'vitest';
import { detectColumns } from '../columnDetector';

describe('detectColumns', () => {
  it('detects a common Brazilian bank export layout', () => {
    const result = detectColumns(['Data', 'Histórico', 'Valor']);
    expect(result.dateCol).toBe('Data');
    expect(result.descriptionCol).toBe('Histórico');
    expect(result.amountCol).toBe('Valor');
    expect(result.confidence).toBe(1);
  });

  it('detects an English-style layout', () => {
    const result = detectColumns(['Date', 'Description', 'Amount']);
    expect(result.dateCol).toBe('Date');
    expect(result.descriptionCol).toBe('Description');
    expect(result.amountCol).toBe('Amount');
  });

  it('detects separate debit/credit columns', () => {
    const result = detectColumns(['DATA', 'DESCRICAO', 'DEBITO', 'CREDITO']);
    expect(result.debitCol).toBe('DEBITO');
    expect(result.creditCol).toBe('CREDITO');
    expect(result.confidence).toBe(1);
  });

  it('returns low confidence for unrecognized headers', () => {
    const result = detectColumns(['Col1', 'Col2', 'Col3']);
    expect(result.confidence).toBeLessThan(1);
    expect(result.dateCol).toBeNull();
  });
});
