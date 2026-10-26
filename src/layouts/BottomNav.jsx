import { NavLink } from 'react-router-dom';
import { Home, Wallet, Target, Sparkles, Menu } from 'lucide-react';
import clsx from 'clsx';

const ITEMS = [
  { to: '/app', label: 'Início', icon: Home, end: true },
  { to: '/app/money', label: 'Dinheiro', icon: Wallet },
  { to: '/app/goals', label: 'Metas', icon: Target },
  { to: '/app/copilot', label: 'Copilot', icon: Sparkles },
  { to: '/app/more', label: 'Mais', icon: Menu },
];

// A floating white pill, like the side tabs of the new layout: the active
// item fills with the accent color.
export default function BottomNav() {
  return (
    <nav className="md:hidden fixed z-40 left-1/2 -translate-x-1/2 bottom-[calc(12px+env(safe-area-inset-bottom))] flex gap-1 rounded-full bg-white p-1.5 shadow-[0_10px_30px_rgba(60,30,20,0.18)]">
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx(
              'flex min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1.5 text-[10.5px] font-bold transition-colors active:opacity-70',
              isActive ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-dim)]'
            )
          }
        >
          <Icon size={18} strokeWidth={2.25} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
