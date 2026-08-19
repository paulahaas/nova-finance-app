export function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCompact(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' });
}

export function formatPercent(value, digits = 1) {
  const n = Number(value) || 0;
  return `${n.toFixed(digits).replace('.', ',')}%`;
}

export function formatDate(date, opts = {}) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', ...opts });
}

export function formatDateLong(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function daysUntil(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((d - now) / (1000 * 60 * 60 * 24)));
}

export function nextSalaryDate(payDay) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (now.getDate() >= payDay) {
    month += 1;
  }
  const date = new Date(year, month, payDay);
  return date;
}
