import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import AppLayout from './layouts/AppLayout';

import Splash from './pages/Splash';
import Login from './pages/auth/Login';
import Onboarding from './pages/onboarding/Onboarding';

// The app's pages load on demand, so opening the NOVA on a phone downloads
// only the screen being shown (the charts library alone is a big chunk).
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Banks = lazy(() => import('./pages/banks/Banks'));
const Cards = lazy(() => import('./pages/cards/Cards'));
const Transactions = lazy(() => import('./pages/transactions/Transactions'));
const Money = lazy(() => import('./pages/money/Money'));
const More = lazy(() => import('./pages/More'));
const Goals = lazy(() => import('./pages/goals/Goals'));
const GoalNew = lazy(() => import('./pages/goals/GoalNew'));
const TravelGoal = lazy(() => import('./pages/goals/TravelGoal'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Budgets = lazy(() => import('./pages/budgets/Budgets'));
const Recurring = lazy(() => import('./pages/recurring/Recurring'));
const Invoices = lazy(() => import('./pages/invoices/Invoices'));
const ImportStatement = lazy(() => import('./pages/imports/ImportStatement'));
const ImportHistory = lazy(() => import('./pages/imports/ImportHistory'));
const Copilot = lazy(() => import('./pages/copilot/Copilot'));
const CanIBuy = lazy(() => import('./pages/copilot/CanIBuy'));
const Insights = lazy(() => import('./pages/reports/Insights'));
const MonthlyClose = lazy(() => import('./pages/reports/MonthlyClose'));
const Forecast = lazy(() => import('./pages/reports/Forecast'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Gamification = lazy(() => import('./pages/Gamification'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const Help = lazy(() => import('./pages/Help'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          {/* Single-user app: no public sign-up, and the old marketing entry
              points just lead to the login. */}
          <Route path="/welcome" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/pro" element={<Navigate to="/app" replace />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/app/banks" element={<Banks />} />
              <Route path="/app/cards" element={<Cards />} />
              <Route path="/app/transactions" element={<Transactions />} />
              <Route path="/app/money" element={<Money />} />
              <Route path="/app/more" element={<More />} />
              <Route path="/app/goals" element={<Goals />} />
              <Route path="/app/goals/new" element={<GoalNew />} />
              <Route path="/app/goals/travel" element={<TravelGoal />} />
              <Route path="/app/subscriptions" element={<Subscriptions />} />
              <Route path="/app/budgets" element={<Budgets />} />
              <Route path="/app/recurring" element={<Recurring />} />
              <Route path="/app/invoices" element={<Invoices />} />
              <Route path="/app/imports" element={<ImportHistory />} />
              <Route path="/app/imports/new" element={<ImportStatement />} />
              <Route path="/app/copilot" element={<Copilot />} />
              <Route path="/app/can-i-buy" element={<CanIBuy />} />
              <Route path="/app/insights" element={<Insights />} />
              <Route path="/app/reports/monthly-close" element={<MonthlyClose />} />
              <Route path="/app/forecast" element={<Forecast />} />
              <Route path="/app/reports" element={<Reports />} />
              <Route path="/app/alerts" element={<Alerts />} />
              <Route path="/app/gamification" element={<Gamification />} />
              <Route path="/app/profile" element={<Profile />} />
              <Route path="/app/settings" element={<Settings />} />
              <Route path="/app/help" element={<Help />} />
            </Route>
          </Route>
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
