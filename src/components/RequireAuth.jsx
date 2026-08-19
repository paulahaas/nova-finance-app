import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';

export default function RequireAuth() {
  const { user, authReady } = useAuth();

  // Firebase's onAuthStateChanged fires asynchronously — wait for it once
  // before deciding to redirect, otherwise a signed-in user briefly
  // bounces to /login on every hard refresh.
  if (!authReady) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;

  return (
    <DataProvider>
      <Outlet />
    </DataProvider>
  );
}
