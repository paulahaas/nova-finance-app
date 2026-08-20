// Tier-2 categorization: TF-IDF + nearest-centroid (Rocchio), not a
// gradient-descent model — there's no ML library allowed here (no
// scikit-learn/TensorFlow), and hand-rolling a numerically stable
// multi-class logistic regression trainer in plain JS is fragile. A
// per-category centroid (the average TF-IDF vector of that category's
// training examples), compared by cosine similarity, is deterministic,
// explainable, and — importantly — trivial to "retrain": just recompute
// one category's centroid when new labeled examples show up.
import { TRAINING_EXAMPLES } from './trainingData.js';
import { normalizeDescription } from './normalizer.js';

const STOPWORDS = new Set(['DE', 'DA', 'DO', 'DOS', 'DAS', 'E', 'EM', 'A', 'O', 'PARA']);

export function tokenize(text) {
  return normalizeDescription(text)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export function buildVocabulary(tokenizedDocs) {
  const df = new Map();
  tokenizedDocs.forEach((tokens) => {
    new Set(tokens).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
  });
  const n = tokenizedDocs.length;
  const idf = new Map();
  df.forEach((count, term) => idf.set(term, Math.log((n + 1) / (count + 1)) + 1));
  return idf;
}

export function tfidfVector(tokens, idf) {
  const tf = new Map();
  tokens.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
  const vector = new Map();
  tf.forEach((count, term) => {
    const weight = idf.get(term);
    if (weight) vector.set(term, (count / tokens.length) * weight);
  });
  return vector;
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  a.forEach((weight, term) => {
    normA += weight * weight;
    if (b.has(term)) dot += weight * b.get(term);
  });
  b.forEach((weight) => {
    normB += weight * weight;
  });
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function computeCentroids(examples, idf) {
  const byCategory = new Map();
  examples.forEach(({ text, category }) => {
    const vector = tfidfVector(tokenize(text), idf);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(vector);
  });

  const centroids = new Map();
  byCategory.forEach((vectors, category) => {
    const sum = new Map();
    vectors.forEach((vector) => {
      vector.forEach((weight, term) => sum.set(term, (sum.get(term) ?? 0) + weight));
    });
    const centroid = new Map();
    sum.forEach((total, term) => centroid.set(term, total / vectors.length));
    centroids.set(category, centroid);
  });
  return centroids;
}

let _model = null;
function getModel() {
  if (_model) return _model;
  const tokenizedDocs = TRAINING_EXAMPLES.map((ex) => tokenize(ex.text));
  const idf = buildVocabulary(tokenizedDocs);
  const centroids = computeCentroids(TRAINING_EXAMPLES, idf);
  _model = { idf, centroids };
  return _model;
}

/**
 * @param {string} description - raw (non-normalized) transaction description
 * @returns {{ category: string, confidence: number } | null}
 */
export function classify(description) {
  const { idf, centroids } = getModel();
  const tokens = tokenize(description);
  if (tokens.length === 0) return null;

  const vector = tfidfVector(tokens, idf);
  let best = null;
  centroids.forEach((centroidVector, category) => {
    const score = cosineSimilarity(vector, centroidVector);
    if (!best || score > best.confidence) best = { category, confidence: score };
  });
  return best;
}
