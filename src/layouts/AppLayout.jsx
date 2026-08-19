import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <div className="md:pl-64">
        <main className="max-w-5xl mx-auto px-4 md:px-8 pt-safe md:pt-0 py-6 md:py-10 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
