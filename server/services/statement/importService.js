// Orchestrates the CSV/OFX import pipeline server-side: parse -> normalize
// -> dedupe-check -> categorize (preview, nothing persisted), then on
// confirm, writes to Firestore via the Admin SDK — mirroring
// openFinanceService.js's deterministic-ID upsert pattern so re-confirming
// the same batch (e.g. a retried request) is idempotent rather than
// duplicating transactions.
//
// All the actual parsing/categorization/detection logic lives in
// src/services/... (shared, isomorphic) so the exact same code also runs
// client-side in local/demo mode (see src/services/statementImportService.js)
// — this file is just the Node-side plumbing around it.

import { randomUUID } from 'crypto';
import { adminDb } from '../firebaseAdmin.js';
import { canImportStatement, canUseAdvancedImports } from '../../../src/config/permissions.js';
import { parseCsv, mapCsvRows } from '../../../src/services/statement/csvParser.js';
import { parseOfx } from '../../../src/services/statement/ofxParser.js';
import { normalizeTransactionRow, normalizeDescription } from '../../../src/services/statement/normalizer.js';
import { categorize, UNCATEGORIZED } from '../../../src/services/statement/categorizer.js';
import { flagDuplicates } from '../../../src/services/statement/duplicateDetector.js';
import { transactionDedupeKey, hashString } from '../../../src/services/statement/hash.js';
import { detectRecurring } from '../../../src/services/recurringService.js';

function detectFormat(filename) {
  return filename.toLowerCase().endsWith('.ofx') ? 'ofx' : 'csv';
}

async function getUserPlan(uid) {
  const snap = await adminDb.collection('users').doc(uid).get();
  return snap.exists ? snap.data().plan ?? 'free' : 'free';
}

/**
 * Reads the caller's plan from Firestore (it isn't in the Auth token) and
 * this month's import count, and returns whether another import is allowed.
 */
export async function checkImportQuota(uid) {
  const plan = await getUserPlan(uid);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const snap = await adminDb
    .collection('users')
    .doc(uid)
    .collection('importBatches')
    .where('importedAt', '>=', startOfMonth)
    .get();
  const importsThisMonth = snap.size;
  const permission = canImportStatement({ plan }, importsThisMonth);
  return { ...permission, plan, importsThisMonth, advancedImports: canUseAdvancedImports({ plan }) };
}

function quotaError() {
  const err = new Error('Limite de importações do seu plano foi atingido este mês.');
  err.status = 403;
  return err;
}

/**
 * @returns {{ needsMapping: true, headers, columns } | { needsMapping: false, format, totalCount, categorizedCount, duplicateCount, transactions }}
 */
export async function parseStatementForUser({ uid, filename, content, bankId, columnMap }) {
  const quota = await checkImportQuota(uid);
  if (!quota.allowed) throw quotaError();

  const format = detectFormat(filename);
  let rawRows;

  if (format === 'ofx') {
    rawRows = parseOfx(content).map((tx) => ({ date: tx.date, description: tx.description, amount: tx.amount }));
  } else {
    const parsed = parseCsv(content);
    const columns = columnMap || parsed.columns;
    if (!columnMap && columns.confidence < 1) {
      return { needsMapping: true, headers: parsed.headers, columns };
    }
    rawRows = mapCsvRows(parsed.rows, columns);
  }

  const normalized = rawRows
    .map((row) => normalizeTransactionRow(row))
    .filter(Boolean)
    .map((row) => ({ ...row, bankId: bankId || null }));

  const [existingSnap, rulesSnap] = await Promise.all([
    adminDb.collection('users').doc(uid).collection('transactions').get(),
    adminDb.collection('users').doc(uid).collection('userCategoryRules').get(),
  ]);
  const existingTransactions = existingSnap.docs.map((d) => d.data());
  const userRules = rulesSnap.docs.map((d) => d.data());

  const deduped = flagDuplicates(normalized, existingTransactions);

  const transactions = deduped.map((row) => {
    const result = categorize(row.description, { userRules, useClassifier: quota.advancedImports });
    return {
      ...row,
      category: result.category,
      suggestedCategory: result.category,
      subcategory: result.subcategory,
      confidence: result.confidence,
      categorySource: result.source,
      include: !row.isDuplicate,
    };
  });

  return {
    needsMapping: false,
    format,
    totalCount: transactions.length,
    categorizedCount: transactions.filter((t) => t.category !== UNCATEGORIZED).length,
    duplicateCount: transactions.filter((t) => t.isDuplicate).length,
    transactions,
  };
}

/**
 * Persists a (possibly user-edited) preview array. batchId is generated
 * client-side at parse time and threaded through here so a retried confirm
 * is idempotent (same batch doc, same deterministic transaction doc IDs).
 */
export async function confirmStatementImport({ uid, batchId, bankId, filename, format, transactions }) {
  const quota = await checkImportQuota(uid);
  if (!quota.allowed) throw quotaError();

  const finalBatchId = batchId || randomUUID();
  const userRef = adminDb.collection('users').doc(uid);
  const transactionsRef = userRef.collection('transactions');
  const rulesRef = userRef.collection('userCategoryRules');

  const included = (transactions || []).filter((t) => t.include !== false);
  const now = new Date().toISOString();

  await Promise.all(
    included.map((tx) => {
      const key = transactionDedupeKey(tx);
      return transactionsRef.doc(`stmt_${key}`).set(
        {
          description: tx.description,
          category: tx.category,
          subcategory: tx.subcategory ?? null,
          amount: tx.amount,
          type: tx.type,
          date: tx.date,
          bankId: bankId || tx.bankId || null,
          source: 'statement-import',
          importBatchId: finalBatchId,
          createdAt: now,
        },
        { merge: true }
      );
    })
  );

  const corrections = included.filter((tx) => tx.suggestedCategory && tx.category !== tx.suggestedCategory);
  await Promise.all(
    corrections.map((tx) => {
      const pattern = normalizeDescription(tx.description);
      const ruleId = hashString(pattern);
      return rulesRef.doc(ruleId).set(
        { pattern, category: tx.category, subcategory: tx.subcategory ?? null, createdAt: now, source: 'user-correction' },
        { merge: true }
      );
    })
  );

  const incomeCount = included.filter((t) => t.type === 'income').length;
  const expenseCount = included.length - incomeCount;
  const duplicateCount = included.filter((t) => t.isDuplicate).length;
  const uncategorizedCount = included.filter((t) => t.category === UNCATEGORIZED).length;

  await userRef.collection('importBatches').doc(finalBatchId).set(
    {
      filename,
      bankId: bankId || null,
      format,
      importedAt: now,
      transactionCount: included.length,
      incomeCount,
      expenseCount,
      duplicateCount,
      uncategorizedCount,
      source: 'statement-import',
    },
    { merge: true }
  );

  if (quota.advancedImports) {
    await refreshRecurringPatterns(uid);
  }

  return { imported: included.length, batchId: finalBatchId };
}

/**
 * Re-runs recurring detection over the user's FULL transaction history
 * (not just the just-imported batch — a subscription paid manually or via
 * Open Finance should be detectable too) and upserts suggestions. Never
 * overwrites a pattern the user already accepted or dismissed.
 */
async function refreshRecurringPatterns(uid) {
  const userRef = adminDb.collection('users').doc(uid);
  const allTxSnap = await userRef.collection('transactions').get();
  const allTransactions = allTxSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const patterns = detectRecurring(allTransactions);

  const recurringRef = userRef.collection('recurringPatterns');
  await Promise.all(
    patterns.map(async (pattern) => {
      const patternId = hashString(`${pattern.bankId}|${pattern.normalizedDescription}`);
      const existing = await recurringRef.doc(patternId).get();
      if (existing.exists && existing.data().status !== 'suggested') return;
      await recurringRef.doc(patternId).set({ ...pattern, status: 'suggested', detectedAt: new Date().toISOString() }, { merge: true });
    })
  );
}
