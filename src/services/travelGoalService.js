// The priority goal (today: "Intercâmbio 2027") gets a two-phase model —
// fase 1 (ida e sustento até o primeiro salário lá) and fase 2 (juntar lá
// fora pra trazer de volta) — plus a country comparison list and a
// checklist, all stored as extra fields on the same goal doc used by the
// generic Goals feature (same spirit as installments being extra fields on
// a transaction, not a new entity). Pure, no Firebase.

import { monthlyGoalContribution } from './financeService.js';

export const DEFAULT_TRAVEL_CHECKLIST = [
  { id: 'passport', label: 'Passaporte', done: true, cost: 0, dueDate: null },
  { id: 'visa', label: 'Visto', done: true, cost: 0, dueDate: null },
  { id: 'course', label: 'Curso ou certificado (se exigido)', done: false, cost: 0, dueDate: null },
  { id: 'flight', label: 'Passagem', done: false, cost: 0, dueDate: null },
  { id: 'insurance', label: 'Seguro viagem', done: false, cost: 0, dueDate: null },
  { id: 'housing', label: 'Moradia nos primeiros meses', done: false, cost: 0, dueDate: null },
  { id: 'job', label: 'Oferta ou busca de emprego', done: false, cost: 0, dueDate: null },
];

/** Total target: sum of both phases when set, falling back to the plain `target`. */
export function travelGoalTotal(goal) {
  if (!goal) return 0;
  const phases = (goal.phase1Target || 0) + (goal.phase2Target || 0);
  return phases > 0 ? phases : goal.target || 0;
}

/** @returns {{ number: 1|2, label, remaining }|null} null when no phase breakdown is set. */
export function travelGoalPhase(goal) {
  if (!goal || !goal.phase1Target) return null;
  const saved = goal.saved || 0;
  if (saved < goal.phase1Target) {
    return { number: 1, label: 'Fase 1 — ida e sustento até o 1º salário', remaining: goal.phase1Target - saved };
  }
  return { number: 2, label: 'Fase 2 — juntar lá fora pra trazer de volta', remaining: Math.max(0, travelGoalTotal(goal) - saved) };
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Whether what's saved is roughly keeping up with the planned monthly pace
 * since the goal was created. null means "not enough information yet"
 * (createdAt still pending, or no monthly plan set) — the UI should treat
 * that as neutral, not as behind.
 */
export function travelGoalOnTrack(goal, now = new Date()) {
  const createdAt = toDate(goal?.createdAt);
  const monthly = goal ? monthlyGoalContribution(goal) : 0;
  if (!createdAt || !monthly) return null;
  const monthsSinceCreated = Math.max(
    0,
    (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
  );
  const expected = monthly * monthsSinceCreated;
  return (goal.saved || 0) >= expected * 0.9;
}

/** The projected date the full (two-phase) target is reached at the planned monthly pace. */
export function travelGoalProjectedDate(goal, now = new Date()) {
  const monthly = monthlyGoalContribution(goal);
  const remaining = Math.max(0, travelGoalTotal(goal) - (goal.saved || 0));
  if (!monthly || remaining <= 0) return null;
  const months = Math.ceil(remaining / monthly);
  const date = new Date(now);
  date.setMonth(date.getMonth() + months);
  return date;
}

export function selectedCountry(goal) {
  return (goal?.countries || []).find((c) => c.id === goal.selectedCountryId) ?? null;
}
