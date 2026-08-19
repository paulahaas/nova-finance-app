import { createContext, useContext } from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import { useLocalAuthProvider } from './authProviders/localAuthProvider';
import { useFirebaseAuthProvider } from './authProviders/firebaseAuthProvider';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Both hooks always run (rules of hooks) — only one's result is used.
  // The local provider is nearly free when idle, so this costs nothing
  // when Firebase is configured, and vice versa.
  const local = useLocalAuthProvider();
  const firebase = useFirebaseAuthProvider();
  const value = isFirebaseConfigured ? firebase : local;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
