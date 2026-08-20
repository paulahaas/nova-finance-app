// Detects recurring transactions (spec section 12) — subscriptions, rent,
// bills — from the user's FULL transaction history, not just a freshly
// imported batch, so a subscription paid manually or synced via Open
// Finance is detected too. Pure/deterministic: groups by merchant + bank,
// checks how regular the interval between charges is and how stable the
// amount is, and only calls something "recurring" once there's enough
// history to say so (spec section 16-style caution — never overclaim).
import { normalizeDescription } from './statement/normalizer.js';

const CANONICAL_FREQUENCIES = [
  { label: 'weekly', days: 7 },
  { label: 'monthly', days: 30 },
  { label: 'yearly', days: 365 },
];

function mean(values) {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function coefficientOfVariation(values) {
  const m = mean(values);
  if (m === 0) return 1;
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance) / Math.abs(m);
}

function closestFrequency(avgIntervalDays) {
  return CANONICAL_FREQUENCIES.reduce((best, f) =>
    Math.abs(f.days - avgIntervalDays) < Math.abs(best.days - avgIntervalDays) ? f : best
  );
}

/**
 * @param {object[]} transactions - the user's full transaction list
 * @param {{ minOccurrences?: number }} options
 * @returns {{ description, normalizedDescription, bankId, category, avgAmount, intervalDays, occurrences, frequency, confidence, lastSeenDate, nextExpectedDate, transactionIds }[]}
 */
export function detectRecurring(transactions, { minOccurrences = 3 } = {}) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const groups = new Map();

  expenses.forEach((t) => {
    const key = `${t.bankId || ''}|${normalizeDescription(t.description)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  });

  const patterns = [];

  groups.forEach((group) => {
    if (group.length < minOccurrences) return;

    const sorted = [...group].sort((a, b) => new Date(a.date) - new Date(b.date));
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((new Date(sorted[i].date) - new Date(sorted[i - 1].date)) / (1000 * 60 * 60 * 24));
    }

    const avgInterval = mean(intervals);
    if (avgInterval < 2) return; // same-day repeats aren't a recurring bill

    const amounts = sorted.map((t) => Math.abs(t.amount));
    const intervalCV = coefficientOfVariation(intervals);
    const amountCV = coefficientOfVariation(amounts);

    const confidence = Math.max(0, Math.min(0.99, 1 - (intervalCV * 0.7 + amountCV * 0.3)));
    if (confidence < 0.5) return;

    const last = sorted[sorted.length - 1];
    patterns.push({
      description: last.description,
      normalizedDescription: normalizeDescription(last.description),
      bankId: last.bankId ?? null,
      category: last.category,
      avgAmount: Math.round(mean(amounts) * 100) / 100,
      intervalDays: Math.round(avgInterval),
      occurrences: sorted.length,
      frequency: closestFrequency(avgInterval).label,
      confidence: Math.round(confidence * 100) / 100,
      lastSeenDate: last.date,
      nextExpectedDate: new Date(new Date(last.date).getTime() + avgInterval * 24 * 60 * 60 * 1000).toISOString(),
      transactionIds: sorted.map((t) => t.id).filter(Boolean),
    });
  });

  return patterns.sort((a, b) => b.confidence - a.confidence);
}
