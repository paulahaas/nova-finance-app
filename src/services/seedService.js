// Local/demo mode has two distinct starting states, and getting them
// mixed up is exactly the confusing bug this file exists to prevent:
//
// - "Criar conta" (signup) → seedEmptyAccount(): a real fresh account,
//   same as what a brand-new Firebase account gets. No fake Nubank
//   balance, no fake card, nothing the user didn't add themselves —
//   only the default category taxonomy, which is real UI, not sample data.
// - "Entrar" (login, no local account yet) → seedDemoAccount(): the
//   quick-look shortcut, pre-filled with the full demo dataset so the app
//   can be explored without setting anything up.
//
// ensureSeeded() is only a safety net for DataProvider mounting before
// either auth path has run — it defaults to empty, never to fake numbers
// appearing by surprise.

import { writeCollection, isSeeded, markSeeded } from './storageService';
import {
  buildDemoBanks,
  buildDemoAccounts,
  buildDemoCards,
  buildDemoCategories,
  buildDemoTransactions,
  buildDemoGoals,
  buildDemoSubscriptions,
  buildDemoAlerts,
  buildDemoAchievements,
} from '../data/demoData';

export function seedDemoAccount() {
  writeCollection('banks', buildDemoBanks());
  writeCollection('accounts', buildDemoAccounts());
  writeCollection('cards', buildDemoCards());
  writeCollection('categories', buildDemoCategories());
  writeCollection('transactions', buildDemoTransactions());
  writeCollection('goals', buildDemoGoals());
  writeCollection('subscriptions', buildDemoSubscriptions());
  writeCollection('alerts', buildDemoAlerts());
  writeCollection('achievements', buildDemoAchievements());
  markSeeded();
}

export function seedEmptyAccount() {
  writeCollection('banks', []);
  writeCollection('accounts', []);
  writeCollection('cards', []);
  writeCollection('categories', buildDemoCategories());
  writeCollection('transactions', []);
  writeCollection('goals', []);
  writeCollection('subscriptions', []);
  writeCollection('alerts', []);
  writeCollection('achievements', []);
  markSeeded();
}

export function ensureSeeded() {
  if (isSeeded()) return;
  seedEmptyAccount();
}
