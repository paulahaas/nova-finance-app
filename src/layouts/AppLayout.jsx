import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

// Pages in the new layout draw their own full-width sections (hero, color
// block, tiles), so they skip the centered content column.
const FULL_BLEED = ['/app', '/app/cards'];

export default function AppLayout() {
  const { pathname } = useLocation();
  const fullBleed = FULL_BLEED.includes(pathname);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--hero-a)_0,var(--hero-b)_460px,var(--color-bg)_920px)] bg-[var(--color-bg)]">
      <TopNav />
      <main
        className={
          fullBleed
            ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0'
            : 'max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10'
        }
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
