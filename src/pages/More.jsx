import { Link } from 'react-router-dom';
import { Lightbulb, CreditCard, Repeat, User, Settings as SettingsIcon, Crown, BarChart3, ChevronRight, MessageCircle, Upload } from 'lucide-react';
import Panel from '../components/Panel';
import { useAuth } from '../contexts/AuthContext';
import { getPlan } from '../config/plans';

const ITEMS = [
  { to: '/app/insights', label: 'Insights', icon: Lightbulb },
  { to: '/app/reports', label: 'Análises', icon: BarChart3 },
  { to: '/app/cards', label: 'Cartões', icon: CreditCard },
  { to: '/app/subscriptions', label: 'Assinaturas', icon: Repeat },
  { to: '/app/imports', label: 'Importar extrato', icon: Upload },
  { to: '/app/profile', label: 'Perfil', icon: User },
  { to: '/app/settings', label: 'Configurações', icon: SettingsIcon },
  { to: '/app/help', label: 'Ajuda', icon: MessageCircle },
];

export default function More() {
  const { user } = useAuth();
  const plan = getPlan(user?.plan);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mais</h1>

      {plan.id === 'free' && (
        <Link to="/pro" className="block">
          <Panel className="flex items-center justify-between bg-[var(--color-accent-soft)] border-[var(--color-accent-dim)]">
            <div className="flex items-center gap-3">
              <Crown size={22} className="text-[var(--color-accent)]" />
              <div>
                <p className="font-medium">NOVA Pro</p>
                <p className="text-sm text-[var(--color-text-dim)]">Desbloqueie recursos ilimitados</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--color-text-dim)]" />
          </Panel>
        </Link>
      )}

      <Panel className="divide-y divide-[var(--color-border)] !p-0">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-5 py-4 min-h-[56px] active:bg-[var(--color-surface-2)] transition-colors"
          >
            <Icon size={20} className="text-[var(--color-text-dim)]" />
            <span className="flex-1 text-sm">{label}</span>
            <ChevronRight size={18} className="text-[var(--color-text-faint)]" />
          </Link>
        ))}
      </Panel>
    </div>
  );
}
