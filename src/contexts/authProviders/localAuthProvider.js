// Demo auth provider — used when Firebase isn't configured (see
// services/firebase.js). Persists to localStorage via storageService so
// the app is fully explorable with zero setup. Mirrors the interface
// exposed by firebaseAuthProvider.js so AuthContext can swap between them
// without the rest of the app knowing which one is active.
//
// "Entrar" only succeeds for an account that already exists locally — it
// used to silently spin up the demo persona for any email typed in, which
// looked like a bug (a card/balance nobody added showing up right after
// "login"). The demo dataset is now only reachable through the explicit
// startDemo() action (see pages/auth/Login.jsx "Ver modo demonstração").

import { useEffect, useState } from 'react';
import { readDoc, writeDoc } from '../../services/storageService';
import { buildDemoUser } from '../../data/demoData';
import { seedDemoAccount, seedEmptyAccount } from '../../services/seedService';

// A real fresh account, not the pre-populated demo persona — onboarding
// (Onboarding.jsx) is what fills in income/payDay/hasCard/hasDebt/goalIntent.
function emptyProfile({ name, email }) {
  return {
    id: 'demo-user',
    name,
    email,
    plan: 'free',
    income: 0,
    payDay: 5,
    hasCard: false,
    hasDebt: false,
    goalIntent: null,
    aiMessagesUsed: 0,
    xp: 0,
    level: 1,
    createdAt: new Date().toISOString(),
  };
}

export function useLocalAuthProvider() {
  const [user, setUser] = useState(() => readDoc('user', null));

  useEffect(() => {
    if (user) writeDoc('user', user);
  }, [user]);

  async function signup({ name, email }) {
    // A genuinely blank slate — same as what a brand-new Firebase account
    // gets. No demo banks/cards/transactions until the user adds their own.
    seedEmptyAccount();
    const newUser = { ...emptyProfile({ name, email }), onboarded: false };
    setUser(newUser);
    return newUser;
  }

  async function login() {
    const existing = readDoc('user', null);
    if (existing) {
      setUser(existing);
      return existing;
    }
    const err = new Error('Nenhuma conta encontrada com esse e-mail. Crie uma conta ou experimente o modo demonstração.');
    err.code = 'demo/account-not-found';
    throw err;
  }

  async function loginWithGoogle() {
    const existing = readDoc('user', null);
    if (existing) {
      setUser(existing);
      return existing;
    }
    // First "Google" sign-in: same as a fresh signup — starts empty, no
    // pre-filled demo data (mirrors firebaseAuthProvider's behavior, where
    // a first Google login also creates a blank profile).
    seedEmptyAccount();
    const newUser = { ...emptyProfile({ name: 'Usuário NOVA', email: 'demo.google@nova.app' }), onboarded: false };
    setUser(newUser);
    return newUser;
  }

  // The explicit "quick look" entry point — pre-filled with the full demo
  // dataset so the app can be explored without adding anything.
  async function startDemo() {
    seedDemoAccount();
    const newUser = { ...buildDemoUser(), onboarded: true };
    setUser(newUser);
    return newUser;
  }

  function logout() {
    setUser(null);
  }

  function completeOnboarding(onboardingData) {
    setUser((prev) => ({ ...prev, ...onboardingData, onboarded: true }));
  }

  function updateUser(patch) {
    setUser((prev) => ({ ...prev, ...patch }));
  }

  function upgradeToPro() {
    setUser((prev) => ({
      ...prev,
      plan: 'pro',
      subscriptionStatus: 'active',
      subscriptionId: `demo_${Date.now()}`,
      subscriptionStart: new Date().toISOString(),
      subscriptionEnd: null,
    }));
  }

  function downgradeToFree() {
    setUser((prev) => ({ ...prev, plan: 'free', subscriptionStatus: 'canceled' }));
  }

  return {
    user,
    authReady: true,
    authMode: 'demo',
    signup,
    login,
    loginWithGoogle,
    startDemo,
    logout,
    completeOnboarding,
    updateUser,
    upgradeToPro,
    downgradeToFree,
    getIdToken: () => Promise.resolve(null),
  };
}
