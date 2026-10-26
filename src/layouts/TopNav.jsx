import { Link, NavLink } from 'react-router-dom';
import clsx from 'clsx';

const LEFT = [
  { to: '/app', label: 'Home', end: true },
  { to: '/app/transactions', label: 'Transações' },
  { to: '/app/cards', label: 'Cartões' },
];
const RIGHT = [
  { to: '/app/goals', label: 'Metas' },
  { to: '/app/copilot', label: 'Copilot' },
  { to: '/app/more', label: 'Mais' },
];

function NavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'py-1 border-b-2 text-[12.5px] font-semibold transition-colors',
          isActive
            ? 'border-[var(--color-ink)] text-[var(--color-text)]'
            : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
        )
      }
    >
      {label}
    </NavLink>
  );
}

// Logo in the middle, links on both sides, account at the far right; on a
// phone only the logo and the account button show (the bottom bar has the rest).
export default function TopNav() {
  return (
    <header className="sticky top-0 z-30 bg-[var(--hero-a)]/90 backdrop-blur-md pt-safe">
      <div className="relative max-w-6xl mx-auto px-4 md:px-8 h-16 md:h-20 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center">
        <nav className="hidden md:flex justify-end gap-8 pr-10">
          {LEFT.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <Link to="/app" className="font-display font-bold text-2xl tracking-[0.06em] justify-self-start md:justify-self-center">
          NOVA<span className="text-[var(--color-accent)]">.</span>
        </Link>
        <nav className="hidden md:flex gap-8 pl-10">
          {RIGHT.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <Link
          to="/app/profile"
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 rounded-[4px] bg-white px-3.5 py-2 font-display text-[10px] font-bold uppercase tracking-[0.1em] shadow-[0_2px_8px_rgba(90,45,25,0.12)]"
        >
          Minha conta
        </Link>
      </div>
    </header>
  );
}
