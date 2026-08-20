// Flags possible duplicates (spec section 17) — never auto-excludes, only
// marks so the preview UI can let the user confirm or uncheck each row.
import { transactionDedupeKey } from './hash.js';

const NEAR_MATCH_WINDOW_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysApart(dateA, dateB) {
  return Math.abs(new Date(dateA) - new Date(dateB)) / MS_PER_DAY;
}

function isNearMatch(tx, other) {
  if (tx.amount !== other.amount) return false;
  if (daysApart(tx.date, other.date) > NEAR_MATCH_WINDOW_DAYS) return false;
  return tx.normalizedDescription === other.normalizedDescription;
}

/**
 * @param {object[]} newTransactions - normalized rows from this import, each with bankId set
 * @param {object[]} existingTransactions - the user's current transactions (from Firestore/local)
 * @returns {object[]} newTransactions with { isDuplicate, duplicateReason } added
 */
export function flagDuplicates(newTransactions, existingTransactions = []) {
  const existingKeys = new Set(
    existingTransactions.map((t) => transactionDedupeKey({ date: t.date, amount: t.amount, description: t.description, bankId: t.bankId }))
  );
  const seenInBatch = new Set();

  return newTransactions.map((tx) => {
    const key = transactionDedupeKey(tx);

    if (existingKeys.has(key)) {
      return { ...tx, isDuplicate: true, duplicateReason: 'existing' };
    }
    if (seenInBatch.has(key)) {
      return { ...tx, isDuplicate: true, duplicateReason: 'batch' };
    }
    seenInBatch.add(key);

    const nearMatch = existingTransactions.some((existing) => isNearMatch(tx, existing));
    if (nearMatch) {
      return { ...tx, isDuplicate: true, duplicateReason: 'similar' };
    }

    return { ...tx, isDuplicate: false, duplicateReason: null };
  });
}
