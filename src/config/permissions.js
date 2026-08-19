// Central permission system. All plan-gated feature checks go through
// canUseFeature() (or one of the named helpers below) so new plans can be
// added later without touching feature code.

import { getPlan, UNLIMITED } from './plans';

const FEATURES = {
  ADD_BANK: 'ADD_BANK',
  CREATE_GOAL: 'CREATE_GOAL',
  ADD_CARD: 'ADD_CARD',
  USE_COPILOT: 'USE_COPILOT',
  ADVANCED_REPORTS: 'ADVANCED_REPORTS',
  ADVANCED_INSIGHTS: 'ADVANCED_INSIGHTS',
  UNLIMITED_HISTORY: 'UNLIMITED_HISTORY',
  EXPORT_DATA: 'EXPORT_DATA',
};

export { FEATURES };

/**
 * @param {{plan: string}} user
 * @param {string} feature - one of FEATURES
 * @param {object} usage - current counts, e.g. { banks, goals, cards, aiMessagesUsed }
 * @returns {{ allowed: boolean, limit?: number, used?: number }}
 */
export function canUseFeature(user, feature, usage = {}) {
  const plan = getPlan(user?.plan);
  const limits = plan.limits;

  switch (feature) {
    case FEATURES.ADD_BANK:
      return withCount(limits.maxBanks, usage.banks ?? 0);
    case FEATURES.CREATE_GOAL:
      return withCount(limits.maxGoals, usage.goals ?? 0);
    case FEATURES.ADD_CARD:
      return withCount(limits.maxCards, usage.cards ?? 0);
    case FEATURES.USE_COPILOT:
      return withCount(limits.aiMessagesPerMonth, usage.aiMessagesUsed ?? 0);
    case FEATURES.ADVANCED_REPORTS:
      return { allowed: !!limits.advancedReports };
    case FEATURES.ADVANCED_INSIGHTS:
      return { allowed: !!limits.advancedInsights };
    case FEATURES.UNLIMITED_HISTORY:
      return { allowed: !!limits.unlimitedHistory };
    case FEATURES.EXPORT_DATA:
      return { allowed: !!limits.exportData };
    default:
      return { allowed: false };
  }
}

function withCount(limit, used) {
  const allowed = limit === UNLIMITED || used < limit;
  return { allowed, limit, used };
}

// Convenience helpers used directly by components/pages.
export const canAddBank = (user, banks) => canUseFeature(user, FEATURES.ADD_BANK, { banks });
export const canCreateGoal = (user, goals) => canUseFeature(user, FEATURES.CREATE_GOAL, { goals });
export const canAddCard = (user, cards) => canUseFeature(user, FEATURES.ADD_CARD, { cards });
export const canUseCopilot = (user, aiMessagesUsed) =>
  canUseFeature(user, FEATURES.USE_COPILOT, { aiMessagesUsed });
export const canUseAdvancedReports = (user) => canUseFeature(user, FEATURES.ADVANCED_REPORTS).allowed;
export const canUseAdvancedInsights = (user) => canUseFeature(user, FEATURES.ADVANCED_INSIGHTS).allowed;
export const canExportData = (user) => canUseFeature(user, FEATURES.EXPORT_DATA).allowed;
export const hasUnlimitedHistory = (user) => canUseFeature(user, FEATURES.UNLIMITED_HISTORY).allowed;
