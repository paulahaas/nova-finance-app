// Different banks export different column names for the same field (spec
// section 4). Tries to auto-detect date/description/amount(/debit/credit)
// columns by header name; returns a low confidence when it can't, so the UI
// can fall back to a manual mapping form instead of guessing wrong.

const DATE_NAMES = ['data', 'date', 'dt', 'data lancamento', 'data da transacao'];
const DESCRIPTION_NAMES = [
  'descricao', 'description', 'historico', 'historico da transacao',
  'lancamento', 'title', 'memo', 'detalhes',
];
const AMOUNT_NAMES = ['valor', 'amount', 'vlr', 'value'];
const DEBIT_NAMES = ['debito', 'debit', 'saida', 'valor debito'];
const CREDIT_NAMES = ['credito', 'credit', 'entrada', 'valor credito'];

function normalizeHeader(header) {
  return (header || '')
    .toString()
    .normalize('NFD')
    .replace(new RegExp('[̀-ͯ]', 'g'), '')
    .trim()
    .toLowerCase();
}

function findColumn(headers, candidates) {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h === candidate);
    if (idx !== -1) return headers[idx];
  }
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

/**
 * @param {string[]} headers
 * @returns {{ dateCol, descriptionCol, amountCol, debitCol, creditCol, confidence }}
 */
export function detectColumns(headers) {
  const dateCol = findColumn(headers, DATE_NAMES);
  const descriptionCol = findColumn(headers, DESCRIPTION_NAMES);
  const amountCol = findColumn(headers, AMOUNT_NAMES);
  const debitCol = findColumn(headers, DEBIT_NAMES);
  const creditCol = findColumn(headers, CREDIT_NAMES);

  const hasAmount = Boolean(amountCol) || Boolean(debitCol || creditCol);
  const found = [dateCol, descriptionCol, hasAmount].filter(Boolean).length;
  const confidence = found / 3;

  return { dateCol, descriptionCol, amountCol, debitCol, creditCol, confidence };
}

export const REQUIRED_FIELDS = [
  { key: 'dateCol', label: 'Data' },
  { key: 'descriptionCol', label: 'Descrição' },
  { key: 'amountCol', label: 'Valor' },
];
