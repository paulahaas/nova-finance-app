// The first real achievements in the app (no gamification engine exists
// otherwise — see firestoreDataProvider.js) — tied to the priority goal:
// savings milestones, and a streak of months on pace, read back from the
// monthly closing reports (users/{uid}/monthlyReports, see
// monthlyCloseService.js's goalPace). Pure, no Firebase.

import { travelGoalTotal } from './travelGoalService.js';

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
