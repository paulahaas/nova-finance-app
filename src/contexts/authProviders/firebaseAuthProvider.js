// Real auth provider, backed by Firebase Auth + Firestore. Active whenever
// services/firebase.js reports isFirebaseConfigured. The Firestore
// `users/{uid}` document is the source of truth for plan/subscription
// state — the Stripe webhook (server/routes/stripe.js) writes to the same
// document, and the onSnapshot listener below picks up those changes live,
// so a successful checkout flips the user to Pro without a page reload.

import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../services/firebase';

function defaultProfile({ name, email }) {
  return {
    name,
    email,
    plan: 'free',
    onboarded: false,
    income: 0,
    payDay: 5,
    hasCard: false,
    hasDebt: false,
    goalIntent: null,
    aiMessagesUsed: 0,
    xp: 0,
    level: 1,
    createdAt: serverTimestamp(),
  };
}

export function useFirebaseAuthProvider() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authStateReady, setAuthStateReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    // auth is null when Firebase isn't configured (services/firebase.js) —
    // this provider is simply unused in that case (see AuthContext.jsx),
    // but its hooks still run, so guard against a null client.
    if (!auth) {
      setAuthStateReady(true);
      setProfileReady(true);
      return undefined;
    }
    return onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthStateReady(true);
      if (!fbUser) {
        setProfile(null);
        setProfileReady(true);
      } else {
        setProfileReady(false); // wait for the Firestore profile snapshot below
      }
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser || !db) return undefined;
    const ref = doc(db, 'users', firebaseUser.uid);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setProfile({ id: firebaseUser.uid, ...snap.data() });
      setProfileReady(true);
    });
  }, [firebaseUser]);

  // Only report "ready" once both the auth state AND (for a signed-in
  // user) their profile doc have resolved — otherwise RequireAuth would
  // see a signed-in-but-profile-not-loaded-yet user as logged out.
  const authReady = authStateReady && profileReady;

  async function signup({ name, email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), defaultProfile({ name, email }));
    return { id: cred.user.uid, ...defaultProfile({ name, email }) };
  }

  async function login({ email, password }) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    const ref = doc(db, 'users', cred.user.uid);
    // First Google sign-in: no profile doc yet, create one.
    await setDoc(
      ref,
      defaultProfile({ name: cred.user.displayName ?? 'Usuário NOVA', email: cred.user.email }),
      { merge: true }
    );
    return cred.user;
  }

  function logout() {
    return signOut(auth);
  }

  async function completeOnboarding(onboardingData) {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), { ...onboardingData, onboarded: true });
  }

  async function updateUser(patch) {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), patch);
  }

  async function upgradeToPro() {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      plan: 'pro',
      subscriptionStatus: 'active',
      subscriptionId: `demo_${Date.now()}`,
      subscriptionStart: new Date().toISOString(),
      subscriptionEnd: null,
    });
  }

  async function downgradeToFree() {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), { plan: 'free', subscriptionStatus: 'canceled' });
  }

  function getIdToken() {
    return firebaseUser ? firebaseUser.getIdToken() : Promise.resolve(null);
  }

  return {
    user: profile,
    authReady,
    authMode: 'firebase',
    signup,
    login,
    loginWithGoogle,
    logout,
    completeOnboarding,
    updateUser,
    upgradeToPro,
    downgradeToFree,
    getIdToken,
  };
}
