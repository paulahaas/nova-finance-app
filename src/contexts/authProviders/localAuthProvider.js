// Demo auth provider — used when Firebase isn't configured (see
// services/firebase.js). Persists to localStorage via storageService so
// the app is fully explorable with zero setup. Mirrors the interface
// exposed by firebaseAuthProvider.js so AuthContext can swap between them
// without the rest of the app knowing which one is active.

import { useEffect, useState } from 'react';
import { readDoc, writeDoc } from '../../services/storageService';
import { buildDemoUser } from '../../data/demoData';
import { seedDemoAccount, seedEmptyAccount } from '../../services/seedService';

function nameFromEmail(email) {
  const local = email?.split('@')[0];
  if (!local) return null;
  return local
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

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

  async function login({ email }) {
    const existing = readDoc('user', null);
    if (existing) {
      setUser(existing);
      return existing;
    }
    // No local account yet: "Entrar" without signing up first is the
    // quick-look shortcut — drop into the pre-filled demo dataset instead
    // of an empty one.
    seedDemoAccount();
    const base = buildDemoUser();
    // Logging in (as opposed to signing up) never collects a name — derive
    // a reasonable one from the email instead of keeping the seeded demo
    // persona's name, which would otherwise stick around regardless of who
    // actually logged in.
    const newUser = { ...base, name: nameFromEmail(email) ?? base.name, email, onboarded: true };
    setUser(newUser);
    return newUser;
  }

  async function loginWithGoogle() {
    return login({ email: 'demo.google@nova.app' });
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
    logout,
    completeOnboarding,
    updateUser,
    upgradeToPro,
    downgradeToFree,
    getIdToken: () => Promise.resolve(null),
  };
}
