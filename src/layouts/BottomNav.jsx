import { NavLink } from 'react-router-dom';
import { Home, Wallet, Target, Sparkles, Menu } from 'lucide-react';
import clsx from 'clsx';

const ITEMS = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/money', label: 'Money', icon: Wallet },
  { to: '/app/goals', label: 'Goals', icon: Target },
  { to: '/app/copilot', label: 'AI', icon: Sparkles },
  { to: '/app/more', label: 'More', icon: Menu },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-lg pb-safe">
      <div className="flex items-stretch justify-around">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[58px] text-[11px] font-medium transition-colors active:opacity-70',
                isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-faint)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'flex items-center justify-center w-9 h-9 rounded-full transition-colors',
                    isActive && 'bg-[var(--color-accent-soft)]'
                  )}
                >
                  <Icon size={20} strokeWidth={2.25} color={isActive ? 'var(--color-accent)' : 'currentColor'} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
