import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useFirestoreDataProvider } from './dataProviders/firestoreDataProvider';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const value = useFirestoreDataProvider(user?.id, user);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
