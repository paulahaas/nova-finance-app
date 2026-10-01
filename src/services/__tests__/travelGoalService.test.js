import { describe, it, expect } from 'vitest';
import { travelGoalTotal, travelGoalPhase, travelGoalOnTrack, travelGoalProjectedDate, selectedCountry } from '../travelGoalService';

const now = new Date(2026, 8, 20); // 2026-09-20

describe('travelGoalTotal', () => {
  it('sums both phases when set', () => {
    expect(travelGoalTotal({ phase1Target: 8000, phase2Target: 12000, target: 1 })).toBe(20000);
  });

  it('falls back to target when no phases are set', () => {
    expect(travelGoalTotal({ target: 5000 })).toBe(5000);
  });
});

describe('travelGoalPhase', () => {
  it('is null when no phase breakdown is set', () => {
    expect(travelGoalPhase({ target: 5000, saved: 100 })).toBeNull();
  });

  it('is phase 1 while under the phase 1 target', () => {
    const phase = travelGoalPhase({ phase1Target: 8000, phase2Target: 12000, saved: 3000 });
    expect(phase).toMatchObject({ number: 1, remaining: 5000 });
  });

  it('is phase 2 once phase 1 is reached', () => {
    const phase = travelGoalPhase({ phase1Target: 8000, phase2Target: 12000, saved: 9000 });
    expect(phase).toMatchObject({ number: 2, remaining: 11000 });
  });
});

describe('travelGoalOnTrack', () => {
  it('returns null without a known createdAt', () => {
    expect(travelGoalOnTrack({ saved: 0, monthlyContribution: 500 }, now)).toBeNull();
  });

  it('is true when saved keeps up with the planned monthly pace', () => {
    const createdAt = new Date(2026, 5, 20); // 3 months before now
    expect(travelGoalOnTrack({ saved: 1500, monthlyContribution: 500, createdAt }, now)).toBe(true);
  });

  it('is false when saved falls well behind the planned pace', () => {
    const createdAt = new Date(2026, 5, 20);
    expect(travelGoalOnTrack({ saved: 100, monthlyContribution: 500, createdAt }, now)).toBe(false);
  });
});

describe('travelGoalProjectedDate', () => {
  it('projects forward from now at the planned monthly pace', () => {
    const date = travelGoalProjectedDate({ target: 10000, saved: 8000, monthlyContribution: 1000 }, now);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10); // 2 months from September (index 8)
  });

  it('is null once the target is already reached', () => {
    expect(travelGoalProjectedDate({ target: 1000, saved: 1000, monthlyContribution: 100 }, now)).toBeNull();
  });
});

describe('selectedCountry', () => {
  it('finds the country matching selectedCountryId', () => {
    const goal = { countries: [{ id: 'c1', name: 'Irlanda' }, { id: 'c2', name: 'Canadá' }], selectedCountryId: 'c2' };
    expect(selectedCountry(goal).name).toBe('Canadá');
  });

  it('is null with no selection', () => {
    expect(selectedCountry({ countries: [{ id: 'c1', name: 'Irlanda' }] })).toBeNull();
  });
});
