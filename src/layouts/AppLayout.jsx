import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import PageHero from './PageHero';

// Pages in the new layout draw their own full-width sections (hero, color
// block, tiles), so they skip the centered content column.
const FULL_BLEED = ['/app', '/app/cards'];

// Every other page opens with its name as a giant word. The Copilot is left
// out: the chat needs the whole height.
const PAGE_WORDS = {
  '/app/transactions': 'TRANSAÇÕES',
  '/app/money': 'DINHEIRO',
  '/app/banks': 'BANCOS',
  '/app/invoices': 'FATURAS',
  '/app/goals': 'METAS',
  '/app/goals/new': 'NOVA META',
  '/app/goals/travel': 'INTERCÂMBIO',
  '/app/subscriptions': 'ASSINATURAS',
  '/app/recurring': 'CONTAS FIXAS',
  '/app/budgets': 'ORÇAMENTO',
  '/app/imports': 'EXTRATOS',
  '/app/imports/new': 'IMPORTAR',
  '/app/can-i-buy': 'POSSO COMPRAR?',
  '/app/insights': 'INSIGHTS',
  '/app/forecast': 'PREVISÃO',
  '/app/reports': 'ANÁLISES',
  '/app/reports/monthly-close': 'FECHAMENTO',
  '/app/alerts': 'ALERTAS',
  '/app/gamification': 'PROGRESSO',
  '/app/profile': 'PERFIL',
  '/app/settings': 'AJUSTES',
  '/app/help': 'AJUDA',
  '/app/more': 'MAIS',
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const fullBleed = FULL_BLEED.includes(pathname);
  const word = PAGE_WORDS[pathname];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--hero-a)_0,var(--hero-b)_460px,var(--color-bg)_920px)] bg-[var(--color-bg)]">
      <TopNav />
      {word && <PageHero word={word} />}
      <main
        className={
          fullBleed
            ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0'
            : 'max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10'
        }
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
