// Real auth provider, backed by Firebase Auth + Firestore. Active whenever
// services/firebase.js reports isFirebaseConfigured. NOVA is single-user:
// there is no sign-up — the one account already exists, and firestore.rules
// only lets its UID read or write anything.

import { useEffect, useState } from 'react';
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { USER_COLLECTIONS } from '../../config/collections';

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
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setProfile({ id: firebaseUser.uid, ...snap.data() });
        setProfileReady(true);
      },
      // Permission denied (any account that isn't the owner): treat as no
      // profile instead of leaving the app stuck on the loading state.
      () => setProfileReady(true)
    );
  }, [firebaseUser]);

  // Only report "ready" once both the auth state AND (for a signed-in
  // user) their profile doc have resolved — otherwise RequireAuth would
  // see a signed-in-but-profile-not-loaded-yet user as logged out.
  const authReady = authStateReady && profileReady;

  async function login({ email, password }) {
    if (!auth) throw new Error('Firebase não configurado: faltam as variáveis VITE_FIREBASE_* no .env.');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
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

  // Re-authenticates first so a wrong password fails before anything is
  // deleted (Firebase would otherwise demand a recent login only after the
  // data was already gone), then wipes every collection, the profile and
  // finally the Auth account itself.
  async function deleteAccount(password) {
    if (!firebaseUser) return;
    await reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(firebaseUser.email, password));

    const uid = firebaseUser.uid;
    for (const name of USER_COLLECTIONS) {
      const snap = await getDocs(collection(db, 'users', uid, name));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'users', uid));
    await deleteUser(firebaseUser);
  }

  function getIdToken() {
    return firebaseUser ? firebaseUser.getIdToken() : Promise.resolve(null);
  }

  return {
    user: profile,
    authReady,
    login,
    resetPassword,
    logout,
    completeOnboarding,
    updateUser,
    deleteAccount,
    getIdToken,
  };
}
