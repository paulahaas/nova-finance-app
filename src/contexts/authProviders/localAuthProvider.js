// Demo auth provider — used when Firebase isn't configured (see
// services/firebase.js). Persists to localStorage via storageService so
// the app is fully explorable with zero setup. Mirrors the interface
// exposed by firebaseAuthProvider.js so AuthContext can swap between them
// without the rest of the app knowing which one is active.

import { useEffect, useState } from 'react';
import { readDoc, writeDoc } from '../../services/storageService';
import { buildDemoUser } from '../../data/demoData';

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

export function useLocalAuthProvider() {
  const [user, setUser] = useState(() => readDoc('user', null));

  useEffect(() => {
    if (user) writeDoc('user', user);
  }, [user]);

  async function signup({ name, email }) {
    const base = buildDemoUser();
    const newUser = { ...base, name, email, onboarded: false };
    setUser(newUser);
    return newUser;
  }

  async function login({ email }) {
    const existing = readDoc('user', null);
    if (existing) {
      setUser(existing);
      return existing;
    }
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
