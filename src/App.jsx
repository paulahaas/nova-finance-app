import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import AppLayout from './layouts/AppLayout';

import Splash from './pages/Splash';
import Welcome from './pages/Welcome';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Onboarding from './pages/onboarding/Onboarding';

import Dashboard from './pages/Dashboard';
import Banks from './pages/banks/Banks';
import Cards from './pages/cards/Cards';
import Transactions from './pages/transactions/Transactions';
import Money from './pages/money/Money';
import More from './pages/More';
import Goals from './pages/goals/Goals';
import GoalNew from './pages/goals/GoalNew';
import Subscriptions from './pages/Subscriptions';
import Copilot from './pages/copilot/Copilot';
import CanIBuy from './pages/copilot/CanIBuy';
import Insights from './pages/reports/Insights';
import Forecast from './pages/reports/Forecast';
import Reports from './pages/reports/Reports';
import Alerts from './pages/Alerts';
import Gamification from './pages/Gamification';
import Profile from './pages/Profile';
import Settings from './pages/settings/Settings';
import Help from './pages/Help';
import ProPlan from './pages/pro/ProPlan';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/pro" element={<ProPlan />} />

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
              <Route path="/app/subscriptions" element={<Subscriptions />} />
              <Route path="/app/copilot" element={<Copilot />} />
              <Route path="/app/can-i-buy" element={<CanIBuy />} />
              <Route path="/app/insights" element={<Insights />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}
