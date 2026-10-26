import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--color-peach)_0,var(--color-cream)_460px,var(--color-bg)_920px)] bg-[var(--color-bg)]">
      <TopNav />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
