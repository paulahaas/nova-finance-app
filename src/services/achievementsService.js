// The first real achievements in the app (no gamification engine exists
// otherwise — see firestoreDataProvider.js) — tied to the priority goal:
// savings milestones, and a streak of months on pace, read back from the
// monthly closing reports (users/{uid}/monthlyReports, see
// monthlyCloseService.js's goalPace). Pure, no Firebase.

import { travelGoalTotal } from './travelGoalService.js';

const XP_PER_LEVEL = 500;
const LEVEL_TITLES = [
  [1, 'Começando a organizar'],
  [3, 'Organizando o dinheiro'],
  [5, 'No controle'],
  [8, 'Mestre das finanças'],
];

/**
 * XP comes from things she actually does: registering transactions, closing
 * months, setting up fixed bills and unlocking achievements. It only ever
 * goes up with real use (nothing is handed out for opening the app).
 */
export function xpFromActivity({ transactions = 0, achievementsUnlocked = 0, monthlyReports = 0, recurringBills = 0 }) {
  return transactions * 5 + achievementsUnlocked * 150 + monthlyReports * 50 + recurringBills * 20;
}

export function levelFromXp(xp) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const title = [...LEVEL_TITLES].reverse().find(([from]) => level >= from)[1];
  return { level, title, xpInLevel: xp % XP_PER_LEVEL, xpForNext: XP_PER_LEVEL };
}

const MILESTONES = [25, 50, 75, 100];
const STREAK_TARGETS = [3, 6, 12];

export function buildAchievements({ goal, monthlyReports = [] }) {
  if (!goal) return [];

  const total = travelGoalTotal(goal);
  const pct = total > 0 ? ((goal.saved || 0) / total) * 100 : 0;

  const achievements = MILESTONES.map((m) => ({
    id: `milestone-${m}`,
    name: `${m}% guardado`,
    description: `Guardar ${m}% do valor total da meta "${goal.name}".`,
    unlocked: pct >= m,
  }));

  const relevant = monthlyReports
    .filter((r) => r.report?.goalPace?.goalName === goal.name)
    .slice()
    .sort((a, b) => (a.month < b.month ? 1 : -1)); // most recent first

  let streak = 0;
  for (const r of relevant) {
    if (r.report.goalPace.aheadDays >= 0) streak++;
    else break;
  }

  STREAK_TARGETS.forEach((n) => {
    achievements.push({
      id: `streak-${n}`,
      name: `${n} meses seguidos no ritmo`,
      description: `Ficar ${n} meses seguidos no ritmo planejado da meta "${goal.name}".`,
      unlocked: streak >= n,
    });
  });

  return achievements;
}
