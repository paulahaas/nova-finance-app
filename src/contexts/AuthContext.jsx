import { createContext, useContext } from 'react';
import { useFirebaseAuthProvider } from './authProviders/firebaseAuthProvider';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const value = useFirebaseAuthProvider();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
