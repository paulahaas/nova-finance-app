// Centralized plan configuration.
// Changing prices or limits here changes them everywhere in the app —
// no plan rule should ever be hard-coded outside this file.

export const UNLIMITED = Infinity;

export const PLAN_IDS = {
  FREE: 'free',
  PRO: 'pro',
};

export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual', // reserved for future use (section 36)
};

export const PLANS = {
  [PLAN_IDS.FREE]: {
    id: PLAN_IDS.FREE,
    name: 'NOVA Free',
    price: { monthly: 0, annual: 0 },
    limits: {
      maxBanks: 2,
      maxGoals: 3,
      maxCards: 3,
      aiMessagesPerMonth: 20,
      advancedReports: false,
      advancedInsights: false,
      unlimitedHistory: false,
      exportData: false,
      importsPerMonth: 3,
      advancedImports: false, // gates the tier-2 classifier + recurring/anomaly detection
    },
  },
  [PLAN_IDS.PRO]: {
    id: PLAN_IDS.PRO,
    name: 'NOVA Pro',
    price: { monthly: 14.9, annual: 14.9 * 12 * 0.8 }, // annual discount placeholder, configurable
    limits: {
      maxBanks: UNLIMITED,
      maxGoals: UNLIMITED,
      maxCards: UNLIMITED,
      aiMessagesPerMonth: UNLIMITED,
      advancedReports: true,
      advancedInsights: true,
      unlimitedHistory: true,
      exportData: true,
      importsPerMonth: UNLIMITED,
      advancedImports: true,
    },
  },
};

export function getPlan(planId) {
  return PLANS[planId] ?? PLANS[PLAN_IDS.FREE];
}

export function formatPrice(value) {
  if (value === 0) return 'Grátis';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
