import { NavLink } from 'react-router-dom';
import {
  Home,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  Target,
  Repeat,
  Sparkles,
  BarChart3,
  User,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { getPlan } from '../config/plans';

const ITEMS = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/transactions', label: 'Transações', icon: ArrowLeftRight },
  { to: '/app/banks', label: 'Bancos', icon: Landmark },
  { to: '/app/cards', label: 'Cartões', icon: CreditCard },
  { to: '/app/goals', label: 'Metas', icon: Target },
  { to: '/app/subscriptions', label: 'Assinaturas', icon: Repeat },
  { to: '/app/copilot', label: 'Copilot', icon: Sparkles },
  { to: '/app/reports', label: 'Análises', icon: BarChart3 },
  { to: '/app/profile', label: 'Perfil', icon: User },
];

export default function Sidebar() {
  const { user } = useAuth();
  const plan = getPlan(user?.plan);
  const isFree = plan.id === 'free';

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <div className="px-6 py-8">
        <span className="text-xl font-semibold tracking-tight">
          NOVA<span className="text-[var(--color-accent)]">.</span>
        </span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 m-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <p className="text-sm font-medium">{plan.name}</p>
        {isFree ? (
          <NavLink to="/pro" className="text-sm text-[var(--color-accent)] hover:underline">
            Upgrade →
          </NavLink>
        ) : (
          <p className="text-xs text-[var(--color-text-dim)]">Assinatura ativa</p>
        )}
      </div>
    </aside>
  );
}
