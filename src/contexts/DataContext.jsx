import { createContext, useContext } from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useLocalDataProvider } from './dataProviders/localDataProvider';
import { useFirestoreDataProvider } from './dataProviders/firestoreDataProvider';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();

  // Both hooks always run (rules of hooks) — only one's result is used,
  // mirroring the AuthProvider split. See dataProviders/*.js.
  const local = useLocalDataProvider(user);
  const firestore = useFirestoreDataProvider(user?.id, user);
  const value = isFirebaseConfigured ? firestore : local;

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
