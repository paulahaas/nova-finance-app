// Frankfurter: free, no API key, data from the European Central Bank — used
// for the country-comparison tool's BRL <-> local-currency numbers.
// api.frankfurter.app now 301-redirects here; fetch() follows cross-origin
// redirects without replaying CORS, so the browser blocks it — calling the
// new host directly avoids that redirect entirely.

const BASE_URL = 'https://api.frankfurter.dev/v1';

/** Units of `to` per 1 unit of `from`. */
export async function fetchRate(from, to) {
  if (!from || !to) return null;
  if (from === to) return 1;
  const res = await fetch(`${BASE_URL}/latest?from=${from}&to=${to}`);
  if (!res.ok) throw new Error('Não consegui buscar a cotação agora.');
  const data = await res.json();
  const rate = data.rates?.[to];
  if (typeof rate !== 'number') throw new Error('Câmbio indisponível para essa moeda.');
  return rate;
}
