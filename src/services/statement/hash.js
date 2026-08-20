// FNV-1a — deliberately not Node's crypto module or async crypto.subtle,
// since this needs to run identically in the browser (local/demo mode) and
// on the server (Firestore mode). Sync, no dependencies, good enough for a
// dedupe key (not a security hash).
export function hashString(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

export function transactionDedupeKey({ date, amount, description, bankId }) {
  const day = (date || '').slice(0, 10);
  const amt = Math.round(Number(amount) * 100);
  const desc = (description || '').trim().toUpperCase();
  return hashString(`${bankId}|${day}|${amt}|${desc}`);
}
