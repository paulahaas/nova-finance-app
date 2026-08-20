// Categorization hierarchy (spec section 10):
//   1. user's own correction rules (userCategoryRules)
//   2. global keyword rules (rules.js)
//   3. tier-2 statistical classifier (classifier.js) — skipped for Free
//      plan users, gated by the advancedImports plan limit
//   4. "Não categorizado"
import { normalizeDescription } from './normalizer.js';
import { applyKeywordRules } from './rules.js';
import { classify } from './classifier.js';

export const UNCATEGORIZED = 'Não categorizado';
const CLASSIFIER_CONFIDENCE_THRESHOLD = 0.12;

/**
 * @param {string} description
 * @param {{ userRules?: {pattern:string,category:string,subcategory?:string}[], useClassifier?: boolean }} options
 * @returns {{ category, subcategory, confidence, source: 'user-rule'|'keyword-rule'|'classifier'|'uncategorized' }}
 */
export function categorize(description, { userRules = [], useClassifier = true } = {}) {
  const normalized = normalizeDescription(description);

  const userRule = userRules.find((rule) => normalized.includes(rule.pattern));
  if (userRule) {
    return { category: userRule.category, subcategory: userRule.subcategory ?? null, confidence: 1, source: 'user-rule' };
  }

  const keywordMatch = applyKeywordRules(normalized);
  if (keywordMatch) {
    return { ...keywordMatch, confidence: 0.95, source: 'keyword-rule' };
  }

  if (useClassifier) {
    const result = classify(description);
    if (result && result.confidence >= CLASSIFIER_CONFIDENCE_THRESHOLD) {
      return { category: result.category, subcategory: null, confidence: result.confidence, source: 'classifier' };
    }
  }

  return { category: UNCATEGORIZED, subcategory: null, confidence: 0, source: 'uncategorized' };
}
