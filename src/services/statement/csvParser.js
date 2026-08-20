import Papa from 'papaparse';
import { detectColumns } from './columnDetector.js';

/**
 * @param {string} content - raw CSV text
 * @returns {{ headers: string[], rows: object[], columns: ReturnType<typeof detectColumns> }}
 */
export function parseCsv(content) {
  const result = Papa.parse(content.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const headers = result.meta.fields || [];
  const columns = detectColumns(headers);

  return { headers, rows: result.data, columns };
}

/**
 * @param {object[]} rows - raw CSV rows (header: true output)
 * @param {{ dateCol, descriptionCol, amountCol, debitCol, creditCol }} columnMap
 * @returns {{ date, description, amount }[] | { date, description, debit, credit }[]}
 */
export function mapCsvRows(rows, columnMap) {
  return rows.map((row) => {
    if (columnMap.amountCol) {
      return {
        date: row[columnMap.dateCol],
        description: row[columnMap.descriptionCol],
        amount: row[columnMap.amountCol],
      };
    }
    return {
      date: row[columnMap.dateCol],
      description: row[columnMap.descriptionCol],
      debit: columnMap.debitCol ? row[columnMap.debitCol] : undefined,
      credit: columnMap.creditCol ? row[columnMap.creditCol] : undefined,
    };
  });
}
