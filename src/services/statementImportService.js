// Client for the statement-import API (server/routes/statements.js): the
// file is read in the browser, then parsed, categorized and (on confirm)
// written to Firestore by the server — see
// server/services/statement/importService.js.
import { API_URL } from '../config/api';

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

async function authedPost(getIdToken, path, body) {
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

/** Parses + categorizes a file into a preview — nothing is persisted yet. */
export function parseStatement({ getIdToken, filename, content, bankId, columnMap }) {
  return authedPost(getIdToken, '/api/statements/parse', { filename, content, bankId, columnMap });
}

/** Persists the (possibly user-edited) preview array. */
export function confirmStatement({ getIdToken, batchId, bankId, filename, format, transactions }) {
  return authedPost(getIdToken, '/api/statements/confirm', { batchId, bankId, filename, format, transactions });
}
