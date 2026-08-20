// Client-side entry point for the import flow. When Firebase is configured
// it just calls the Express API (server/services/statement/importService.js
// does the real work there). In local/demo mode there is no server to call
// (requireAuth would reject it anyway — there's no real Firebase ID token),
// so this runs the exact same pure parsing/categorization/detection modules
// directly in the browser and writes through the local data provider's bulk
// methods instead. Either way the UI (ImportStatement.jsx) calls the same
// three functions below and doesn't need to know which mode it's in.
import { isFirebaseConfigured } from './firebase';
import { canImportStatement, canUseAdvancedImports } from '../config/permissions';
import { parseCsv, mapCsvRows } from './statement/csvParser.js';
import { parseOfx } from './statement/ofxParser.js';
import { normalizeTransactionRow, normalizeDescription } from './statement/normalizer.js';
import { categorize, UNCATEGORIZED } from './statement/categorizer.js';
import { flagDuplicates } from './statement/duplicateDetector.js';
import { detectRecurring } from './recurringService.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

function detectFormat(filename) {
  return filename.toLowerCase().endsWith('.ofx') ? 'ofx' : 'csv';
}

function readWithEncoding(file, encoding) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsText(file, encoding);
  });
}

// Bank exports are sometimes Latin-1 rather than UTF-8. Try UTF-8 first;
// if the result contains the "unknown character" replacement glyph, the
// file almost certainly wasn't UTF-8, so retry with the common BR fallback.
export async function readStatementFile(file) {
  const utf8 = await readWithEncoding(file, 'utf-8');
  const content = utf8.includes('�') ? await readWithEncoding(file, 'ISO-8859-1') : utf8;
  return { filename: file.name, content };
}

async function authedFetch(getIdToken, path, body) {
  const token = await getIdToken();
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor de importação agora. Tente novamente em instantes.');
  }
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Falha na importação');
    err.status = res.status;
    throw err;
  }
  return data;
}

function localQuota(user, importBatches) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const importsThisMonth = (importBatches || []).filter((b) => new Date(b.importedAt) >= startOfMonth).length;
  const permission = canImportStatement(user, importsThisMonth);
  return { ...permission, plan: user?.plan ?? 'free', importsThisMonth, advancedImports: canUseAdvancedImports(user) };
}

export async function getImportQuota({ getIdToken, user, importBatches }) {
  if (isFirebaseConfigured) return authedFetch(getIdToken, '/api/statements/quota', {}).catch(() => localQuota(user, importBatches));
  return localQuota(user, importBatches);
}

function categorizeRows(rows, { userRules, useClassifier }) {
  return rows.map((row) => {
    const result = categorize(row.description, { userRules, useClassifier });
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
}

function buildPreview(normalized, existingTransactions, userRules, useClassifier, format) {
  const deduped = flagDuplicates(normalized, existingTransactions);
  const transactions = categorizeRows(deduped, { userRules, useClassifier });
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
 * Parses+categorizes a file into a preview — nothing is persisted yet.
 * @param {{ getIdToken, filename, content, bankId, columnMap, user, data }} args
 */
export async function parseStatement({ getIdToken, filename, content, bankId, columnMap, user, data }) {
  if (isFirebaseConfigured) {
    return authedFetch(getIdToken, '/api/statements/parse', { filename, content, bankId, columnMap });
  }

  const quota = localQuota(user, data.importBatches);
  if (!quota.allowed) throw new Error('Limite de importações do seu plano foi atingido este mês.');

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

  return buildPreview(normalized, data.transactions, data.userCategoryRules || [], quota.advancedImports, format);
}

/**
 * Persists the (possibly user-edited) preview array.
 * @param {{ getIdToken, batchId, bankId, filename, format, transactions, user, data }} args
 */
export async function confirmStatement({ getIdToken, batchId, bankId, filename, format, transactions, user, data }) {
  if (isFirebaseConfigured) {
    return authedFetch(getIdToken, '/api/statements/confirm', { batchId, bankId, filename, format, transactions });
  }

  const quota = localQuota(user, data.importBatches);
  if (!quota.allowed) throw new Error('Limite de importações do seu plano foi atingido este mês.');

  const included = transactions.filter((t) => t.include !== false);

  data.addTransactionsBulk(
    included.map((tx) => ({
      description: tx.description,
      category: tx.category,
      subcategory: tx.subcategory ?? null,
      amount: tx.amount,
      type: tx.type,
      date: tx.date,
      bankId: bankId || tx.bankId || null,
      source: 'statement-import',
      importBatchId: batchId,
    }))
  );

  included
    .filter((tx) => tx.suggestedCategory && tx.category !== tx.suggestedCategory)
    .forEach((tx) => {
      data.addUserCategoryRule({
        pattern: normalizeDescription(tx.description),
        category: tx.category,
        subcategory: tx.subcategory ?? null,
        source: 'user-correction',
      });
    });

  const finalBatchId = data.addImportBatch({
    id: batchId,
    filename,
    bankId: bankId || null,
    format,
    importedAt: new Date().toISOString(),
    transactionCount: included.length,
    incomeCount: included.filter((t) => t.type === 'income').length,
    expenseCount: included.filter((t) => t.type === 'expense').length,
    duplicateCount: included.filter((t) => t.isDuplicate).length,
    uncategorizedCount: included.filter((t) => t.category === UNCATEGORIZED).length,
    source: 'statement-import',
  });

  if (quota.advancedImports) {
    const allTransactions = [...data.transactions, ...included];
    data.setRecurringPatternsBulk(detectRecurring(allTransactions));
  }

  return { imported: included.length, batchId: finalBatchId };
}
