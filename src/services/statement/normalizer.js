// Turns a raw parsed row (from the CSV or OFX parser) into the same shape
// used by users/{uid}/transactions everywhere else in the app: description,
// amount (signed), type, date (ISO string). Keeps both the original and a
// normalized description — see categorizer.js / rules.js, which match
// against the normalized one.

// Strips common noise merchants append to a statement line ("IFOOD
// *PEDIDO 1234" -> "IFOOD"), so rules/classifier match the merchant, not a
// one-off order id.
const NOISE_PATTERNS = [
  /\*.*/, // "IFOOD *PEDIDO 1234" -> "IFOOD "
  /\d{4,}/g, // long numeric ids (order/auth codes)
  /\s{2,}/g,
];

export function normalizeDescription(raw) {
  let text = (raw || '').toUpperCase().trim();
  text = text
    .normalize('NFD')
    .replace(new RegExp('[̀-ͯ]', 'g'), ''); // strip accents (combining marks)
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, ' ');
  }
  return text.replace(/\s+/g, ' ').trim();
}

// Accepts "12/08/2026", "2026-08-12", "12-08-2026" (dd-mm-yyyy assumed for
// slash/dash-ambiguous BR exports) and returns an ISO date string.
export function parseStatementDate(raw) {
  const value = (raw || '').trim();
  if (!value) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d)).toISOString();
  }

  const brMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (brMatch) {
    const [, d, m, yRaw] = brMatch;
    const y = yRaw.length === 2 ? Number(`20${yRaw}`) : Number(yRaw);
    return new Date(y, Number(m) - 1, Number(d)).toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

// Accepts "1.234,56", "1234,56", "-45.90", "45.90" (BR decimal-comma and
// plain decimal-point exports both happen in practice).
export function parseStatementAmount(raw) {
  if (typeof raw === 'number') return raw;
  let value = (raw ?? '').toString().trim();
  if (!value) return NaN;

  const negative = /^\(.*\)$/.test(value) || value.startsWith('-');
  value = value.replace(/[()\s]/g, '').replace(/^-/, '');

  if (value.includes(',')) {
    // BR format: "." is a thousands separator, "," is decimal.
    value = value.replace(/\./g, '').replace(',', '.');
  }

  const n = Number(value.replace(/[^\d.-]/g, ''));
  if (Number.isNaN(n)) return NaN;
  return negative ? -Math.abs(n) : n;
}

/**
 * @param {object} row - { date, description, amount } OR { date, description, debit, credit }
 * @returns {{ description, normalizedDescription, amount, type, date } | null}
 */
export function normalizeTransactionRow(row) {
  const date = parseStatementDate(row.date);
  const description = (row.description || '').trim();
  if (!date || !description) return null;

  let amount;
  if (row.amount !== undefined) {
    amount = parseStatementAmount(row.amount);
  } else {
    const debit = row.debit ? parseStatementAmount(row.debit) : 0;
    const credit = row.credit ? parseStatementAmount(row.credit) : 0;
    amount = credit - Math.abs(debit);
  }
  if (Number.isNaN(amount) || amount === 0) return null;

  return {
    description,
    normalizedDescription: normalizeDescription(description),
    amount,
    type: amount >= 0 ? 'income' : 'expense',
    date,
  };
}
