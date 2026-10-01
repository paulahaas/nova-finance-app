// Deterministic, no-AI parser for "gastei 45 no ifood"-style chat messages —
// this is what runs when no AI provider is configured (server/services/
// aiService.js asks the LLM first and falls back to this when it isn't
// available, or as a safety net if the LLM's JSON doesn't parse). Pure and
// isomorphic: reuses the same statement-import building blocks (BR date/
// amount parsing, the categorizer) so a "gasto por chat" gets categorized
// exactly like an imported statement line would.
import { parseStatementAmount, parseStatementDate, normalizeDescription } from './statement/normalizer.js';
import { categorize } from './statement/categorizer.js';
import { CATEGORIES, INCOME_CATEGORY } from '../config/categories.js';

const INCOME_VERBS = ['recebi', 'ganhei', 'caiu', 'entrou', 'depositaram', 'me pagaram', 'pagaram-me'];
const FILLER_WORDS = new Set([
  'no', 'na', 'em', 'de', 'do', 'da', 'com', 'pelo', 'pela', 'um', 'uma', 'o', 'a',
  'gastei', 'paguei', 'comprei', 'comprando', 'recebi', 'ganhei', 'hoje', 'ontem', 'anteontem', 'reais', 'r$',
]);

const AMOUNT_RE = /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:[.,]\d{1,2})?)/i;
const INSTALLMENTS_RE = /\b(?:em\s*)?(\d{1,2})\s*x\b/i;
const DATE_RE = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/;

function extractDate(text, now) {
  if (/\bhoje\b/i.test(text)) return now;
  if (/\banteontem\b/i.test(text)) return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
  if (/\bontem\b/i.test(text)) return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const m = text.match(DATE_RE);
  if (m) {
    const parsed = parseStatementDate(m[1]);
    if (parsed) return new Date(parsed);
  }
  return now;
}

function extractCard(text, cards) {
  const normalized = normalizeDescription(text);
  return cards.find((c) => c.name && normalized.includes(normalizeDescription(c.name))) ?? null;
}

function cleanDescription(text, { amountMatch, installmentsMatch, dateMatch }) {
  let s = text;
  [amountMatch, installmentsMatch, dateMatch].forEach((m) => {
    if (m) s = s.replace(m[0], ' ');
  });
  const words = s
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !FILLER_WORDS.has(w.toLowerCase()));
  const cleaned = words.join(' ').trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : text.trim();
}

/** Cheap pre-check so a plain question never triggers a transaction parse. */
export function looksLikeExpenseMessage(text) {
  const q = text.toLowerCase();
  const flat = normalizeDescription(q).toLowerCase();
  if (/\b(apag|remov|desfaz|delet)\w*\b.*\bultim/.test(flat)) return true;
  if (/\b(corrig|muda|mudar|troca|trocar)\w*\b/.test(flat) && (/\bcategoria\b/.test(flat) || AMOUNT_RE.test(q))) return true;
  if (/^(?:o|a)\s+.+\s+(?:foi|era)\s+/i.test(q) && AMOUNT_RE.test(q)) return true;
  return AMOUNT_RE.test(q) && !/\?\s*$/.test(text.trim());
}

/** Finds the transaction a correction/deletion refers to — an explicit hint
 * ("uber") matched by description, or the most recent one when the hint is
 * empty or means "the last one". Exported so the AI-extraction path (server)
 * resolves targets the same way the regex path does. */
export function resolveTarget(recentTransactions, hint) {
  const sorted = [...recentTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!hint || /^(o |a )?(último|ultima|última)$/i.test(hint.trim())) return sorted[0] ?? null;
  const normalizedHint = normalizeDescription(hint);
  return sorted.find((t) => normalizeDescription(t.description).includes(normalizedHint)) ?? sorted[0] ?? null;
}
const findRecent = resolveTarget;

/** Resolves "hoje"/"ontem"/"anteontem"/"dd/mm[/aaaa]" to a Date — exported
 * so the AI-extraction path can reuse the same relative-date vocabulary. */
export function resolveRelativeDate(word, now = new Date()) {
  return extractDate(String(word ?? ''), now);
}

/**
 * Turns the AI extractor's raw JSON (see server/services/aiService.js ->
 * extractExpenseWithAi) into the exact same result shape parseExpenseMessage
 * returns, so the route and the client don't need to know which path
 * produced it. Never trusts the AI's arithmetic or category spelling
 * unchecked — amounts are re-validated and an unrecognized category falls
 * back to the deterministic classifier.
 * @param {object|null} json
 */
export function fromAiExtraction(json, { cards = [], userRules = [], recentTransactions = [], now = new Date() } = {}) {
  if (!json || typeof json !== 'object') return { intent: 'none' };

  if (json.intent === 'delete') {
    const target = resolveTarget(recentTransactions, json.targetHint);
    return target ? { intent: 'delete', transaction: target } : { intent: 'delete_unresolved' };
  }

  if (json.intent === 'correct') {
    const patch = {};
    if (Number.isFinite(json.patchAmount) && json.patchAmount > 0) {
      const target = resolveTarget(recentTransactions, json.targetHint);
      patch.amount = Math.abs(json.patchAmount) * Math.sign((target && target.amount) || -1);
    }
    if (typeof json.patchCategory === 'string') {
      const category = CATEGORIES.find((c) => normalizeDescription(c) === normalizeDescription(json.patchCategory));
      if (category) patch.category = category;
    }
    if (!Object.keys(patch).length) return { intent: 'none' };
    const target = resolveTarget(recentTransactions, json.targetHint);
    return target ? { intent: 'correct', transaction: target, patch } : { intent: 'correct_unresolved', patch };
  }

  if (json.intent !== 'create') return { intent: 'none' };
  if (!Number.isFinite(json.amount) || json.amount <= 0) return { intent: 'none' };

  const isIncome = json.type === 'income';
  const description = typeof json.description === 'string' && json.description.trim() ? json.description.trim() : isIncome ? 'Entrada' : 'Gasto';
  const date = resolveRelativeDate(json.date, now);
  const card = extractCard(description, cards);

  const knownCategory = typeof json.category === 'string' && [...CATEGORIES, INCOME_CATEGORY].find((c) => normalizeDescription(c) === normalizeDescription(json.category));
  const classified = knownCategory ? null : categorize(description, { userRules, useClassifier: true });

  return {
    intent: 'create',
    transaction: {
      description,
      amount: isIncome ? Math.abs(json.amount) : -Math.abs(json.amount),
      type: isIncome ? 'income' : 'expense',
      date: date.toISOString(),
      category: knownCategory || (isIncome ? INCOME_CATEGORY : classified.category),
      subcategory: classified?.subcategory ?? null,
      confidence: classified?.confidence ?? 0.9,
      categorySource: knownCategory ? 'ai' : classified.source,
      cardId: card?.id ?? null,
      bankId: card?.bankId ?? null,
      installmentsTotal: Number.isInteger(json.installments) ? Math.min(24, Math.max(1, json.installments)) : 1,
    },
  };
}

/**
 * @param {string} text
 * @param {{ cards?: object[], userRules?: object[], recentTransactions?: object[], now?: Date }} options
 * @returns {{ intent: 'create' }|{ intent: 'delete', transaction }|{ intent: 'delete_unresolved' }
 *          |{ intent: 'correct', transaction, patch }|{ intent: 'correct_unresolved', patch }|{ intent: 'none' }}
 */
export function parseExpenseMessage(text, { cards = [], userRules = [], recentTransactions = [], now = new Date() } = {}) {
  const q = text.trim();
  const lower = q.toLowerCase();
  // Accent-insensitive copy for intent keywords ("último" vs "ultimo") —
  // word-boundary regexes get unreliable around accented characters, so
  // every intent check below matches against this instead of `lower`.
  const flat = normalizeDescription(lower).toLowerCase();

  // "apaga o último", "desfaz a última transação"
  if (/\b(apag|remov|desfaz|delet)\w*\b/.test(flat) && /\bultim\w*|\b(isso|ele|ela)\b/.test(flat)) {
    const target = findRecent(recentTransactions, null);
    return target ? { intent: 'delete', transaction: target } : { intent: 'delete_unresolved' };
  }

  // "muda a categoria do uber pra transporte" / "categoria do último pra saúde"
  const categoryMatch = lower.match(/categoria\s+d[oa]\s+(.+?)\s+(?:pra|para)\s+(.+)$/i);
  if (categoryMatch) {
    const category = CATEGORIES.find((c) => normalizeDescription(c) === normalizeDescription(categoryMatch[2]));
    if (category) {
      const target = findRecent(recentTransactions, categoryMatch[1]);
      return target ? { intent: 'correct', transaction: target, patch: { category } } : { intent: 'correct_unresolved', patch: { category } };
    }
  }

  // "o uber foi 21", "corrige o valor do uber pra 21,90"
  const amountCorrection =
    lower.match(/^(?:o|a)\s+(.+?)\s+(?:foi|era)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i) ||
    lower.match(/corrig\w*\s+(?:o\s+valor\s+d[oa]\s+)?(.+?)\s+(?:pra|para)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
  if (amountCorrection) {
    const amount = parseStatementAmount(amountCorrection[2]);
    if (!Number.isNaN(amount)) {
      const target = findRecent(recentTransactions, amountCorrection[1]);
      // Keep the target's own sign (expense stays negative, income stays
      // positive) — only the magnitude changes.
      const patch = { amount: target ? Math.abs(amount) * Math.sign(target.amount || -1) : -Math.abs(amount) };
      return target ? { intent: 'correct', transaction: target, patch } : { intent: 'correct_unresolved', patch };
    }
  }

  // New transaction: needs a recognizable amount.
  const amountMatch = q.match(AMOUNT_RE);
  if (!amountMatch) return { intent: 'none' };
  const amount = parseStatementAmount(amountMatch[1]);
  if (!amount || Number.isNaN(amount)) return { intent: 'none' };

  const installmentsMatch = q.match(INSTALLMENTS_RE);
  const dateMatch = q.match(DATE_RE);
  const date = extractDate(q, now);
  const card = extractCard(q, cards);
  const isIncome = INCOME_VERBS.some((v) => lower.includes(v));
  const description = cleanDescription(q, { amountMatch, installmentsMatch, dateMatch }) || (isIncome ? 'Entrada' : 'Gasto');

  const result = categorize(description, { userRules, useClassifier: true });
  const installmentsTotal = installmentsMatch ? Math.min(24, Math.max(1, Number(installmentsMatch[1]))) : 1;

  return {
    intent: 'create',
    transaction: {
      description,
      amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
      date: date.toISOString(),
      category: isIncome ? INCOME_CATEGORY : result.category,
      subcategory: result.subcategory,
      confidence: result.confidence,
      categorySource: result.source,
      cardId: card?.id ?? null,
      bankId: card?.bankId ?? null,
      installmentsTotal,
    },
  };
}
