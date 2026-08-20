import { describe, it, expect } from 'vitest';
import { parseCsv, mapCsvRows } from '../csvParser';

// Semicolon-delimited, like most Brazilian bank exports — commas are the
// decimal separator inside a field, so comma-delimited would misalign columns.
const SAMPLE_CSV = `Data;Histórico;Valor
12/08/2026;NETFLIX;-39,90
13/08/2026;"SALARIO, EMPRESA X";4000,00`;

describe('parseCsv', () => {
  it('extracts headers and rows, auto-detecting columns', () => {
    const { headers, rows, columns } = parseCsv(SAMPLE_CSV);
    expect(headers).toEqual(['Data', 'Histórico', 'Valor']);
    expect(rows).toHaveLength(2);
    expect(columns.dateCol).toBe('Data');
    expect(columns.amountCol).toBe('Valor');
  });
});

describe('mapCsvRows', () => {
  it('maps raw rows using a single-amount column map', () => {
    const { rows, columns } = parseCsv(SAMPLE_CSV);
    const mapped = mapCsvRows(rows, columns);
    expect(mapped[0]).toMatchObject({ date: '12/08/2026', description: 'NETFLIX' });
  });

  it('maps raw rows using a debit/credit column map', () => {
    const rows = [{ D: '12/08/2026', Desc: 'Aluguel', Deb: '1400', Cred: '' }];
    const mapped = mapCsvRows(rows, { dateCol: 'D', descriptionCol: 'Desc', debitCol: 'Deb', creditCol: 'Cred' });
    expect(mapped[0]).toMatchObject({ date: '12/08/2026', description: 'Aluguel', debit: '1400', credit: '' });
  });
});
