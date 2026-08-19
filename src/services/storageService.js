// Local persistence layer. In demo mode this is the source of truth,
// backed by localStorage and shaped like the Firestore collections
// described in the database structure (users, banks, accounts,
// transactions, cards, goals, subscriptions, ...). Swapping this module
// for a real Firestore/Open Finance-backed service is the intended
// integration point for production.

const NAMESPACE = 'nova';

function key(collection) {
  return `${NAMESPACE}:${collection}`;
}

export function readCollection(collection, fallback = []) {
  try {
    const raw = localStorage.getItem(key(collection));
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeCollection(collection, data) {
  localStorage.setItem(key(collection), JSON.stringify(data));
}

export function readDoc(collection, fallback = null) {
  try {
    const raw = localStorage.getItem(key(collection));
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeDoc(collection, data) {
  localStorage.setItem(key(collection), JSON.stringify(data));
}

export function clearAll() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(`${NAMESPACE}:`))
    .forEach((k) => localStorage.removeItem(k));
}

export function isSeeded() {
  return localStorage.getItem(`${NAMESPACE}:seeded`) === 'true';
}

export function markSeeded() {
  localStorage.setItem(`${NAMESPACE}:seeded`, 'true');
}
