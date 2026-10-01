import { describe, it, expect } from 'vitest';
import { buildAchievements } from '../achievementsService';

describe('buildAchievements', () => {
  it('returns [] without a priority goal', () => {
    expect(buildAchievements({ goal: null })).toEqual([]);
  });

  it('unlocks savings milestones up to the current percentage', () => {
    const goal = { name: 'Intercâmbio', saved: 5500, phase1Target: 8000, phase2Target: 12000 };
    const achievements = buildAchievements({ goal });
    const unlocked = achievements.filter((a) => a.unlocked).map((a) => a.id);
    expect(unlocked).toEqual(['milestone-25']); // 5500/20000 = 27.5%
  });

  it('unlocks a streak achievement from consecutive on-pace months, most recent first', () => {
    const goal = { name: 'Intercâmbio', saved: 0, target: 10000 };
    const monthlyReports = [
      { month: '2026-09', report: { goalPace: { goalName: 'Intercâmbio', aheadDays: 5 } } },
      { month: '2026-08', report: { goalPace: { goalName: 'Intercâmbio', aheadDays: 2 } } },
      { month: '2026-07', report: { goalPace: { goalName: 'Intercâmbio', aheadDays: 1 } } },
      { month: '2026-06', report: { goalPace: { goalName: 'Intercâmbio', aheadDays: -10 } } },
    ];
    const achievements = buildAchievements({ goal, monthlyReports });
    expect(achievements.find((a) => a.id === 'streak-3').unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'streak-6').unlocked).toBe(false);
  });

  it('breaks the streak at the first behind-pace month and ignores reports for other goals', () => {
    const goal = { name: 'Intercâmbio', saved: 0, target: 10000 };
    const monthlyReports = [
      { month: '2026-09', report: { goalPace: { goalName: 'Intercâmbio', aheadDays: -1 } } },
      { month: '2026-08', report: { goalPace: { goalName: 'Outra meta', aheadDays: 10 } } },
    ];
    const achievements = buildAchievements({ goal, monthlyReports });
    expect(achievements.find((a) => a.id === 'streak-3').unlocked).toBe(false);
  });
});
