import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronRight, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import Card3D from '../components/card/Card3D';
import Panel from '../components/Panel';
import ProgressBar from '../components/ProgressBar';
import QuickExpenseEntry from '../components/QuickExpenseEntry';
import { CARD_COPY, CARD_TYPES, giantSizeFor } from '../config/cardTypes';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { useShowcaseTheme } from '../hooks/useShowcaseTheme';
import { primaryGoal, pulseStatus } from '../services/financeService';
import { primaryRecommendation } from '../services/insightsService';
import { travelGoalOnTrack, travelGoalPhase, travelGoalProjectedDate, travelGoalTotal, selectedCountry } from '../services/travelGoalService';
import { formatCurrency, formatDate, formatDateLong, nextSalaryDate } from '../utils/format';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const PULSE_DOT = {
  good: 'bg-[var(--color-positive)]',
  caution: 'bg-[var(--color-warning)]',
  alert: 'bg-[var(--color-negative)]',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { computed, goals, alerts, transactions, cards } = useData();
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const navigate = useNavigate();
  const [cardIndex, setCardIndex] = useState(0);
  const [demoType, setDemoType] = useState('credit');

  const shown = cards.length ? cards[cardIndex % cards.length] : null;
  const type = shown?.type ?? demoType;
  useShowcaseTheme(type);

  const now = new Date();
  const monthWord = now.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  const holder = user?.name ?? '';
  const salary = nextSalaryDate(user?.payDay ?? 5);
  const pulse = pulseStatus({ available: computed.available, monthlyIncome: computed.monthIncome });
  const savings = computed.monthIncome - computed.monthExpenses;
  const barMax = Math.max(computed.monthIncome, computed.monthExpenses);

  const mainGoal = primaryGoal(goals);
  const isTravelGoal = mainGoal && Array.isArray(mainGoal.countries);
  const mainGoalTotal = isTravelGoal ? travelGoalTotal(mainGoal) : mainGoal?.target;
  const phase = isTravelGoal ? travelGoalPhase(mainGoal) : null;
  const onTrack = isTravelGoal ? travelGoalOnTrack(mainGoal) : null;
  const projected = isTravelGoal ? travelGoalProjectedDate(mainGoal) : null;
  const destinationCountry = isTravelGoal ? selectedCountry(mainGoal) : null;
  const { rate: destinationRate } = useExchangeRate('BRL', destinationCountry?.currencyCode);

  return (
    <div>
      <section className="sc-hero">
        <div className="sc-rail" role="tablist" aria-label={cards.length ? 'Seus cartões' : 'Tipos de cartão'}>
          {cards.length
            ? cards.map((c, i) => (
                <button key={c.id} type="button" role="tab" aria-selected={i === cardIndex % cards.length} title={c.name} onClick={() => setCardIndex(i)}>
                  {c.name.length > 16 ? `${c.name.slice(0, 15)}…` : c.name}
                </button>
              ))
            : CARD_TYPES.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={demoType === t} onClick={() => setDemoType(t)}>
                  {CARD_COPY[t].label}
                </button>
              ))}
          <button type="button" className="rg" aria-label="Adicionar ou ver cartões" title="Cartões" onClick={() => navigate('/app/cards')}>
            <Plus size={15} />
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-dim)] pt-1 pb-1">
          {greeting()}, {user?.name?.split(' ')[0]}
        </p>
        <div className="sc-hero-art">
          <h1 className="sc-giant" style={{ '--gd': giantSizeFor(monthWord), '--gmax': 230 }}>
            {monthWord}
            <sup>{String(now.getFullYear()).slice(2)}</sup>
          </h1>
          <Card3D
            key={shown?.id ?? 'demo'}
            type={type}
            nickname={shown?.name ?? ''}
            last4={shown?.last4 ?? ''}
            expiry={shown?.expiry ?? ''}
            holder={holder}
          />
        </div>

        <div className="sc-info">
          <p className="cap">Saldo disponível</p>
          <p className="amount">{formatCurrency(computed.totalBalance)}</p>
          <p className="desc">
            Você pode gastar <b>{formatCurrency(computed.available)}</b> até o próximo salário ({formatDate(salary)}, em {computed.daysToSalary} dias). Dá{' '}
            {formatCurrency(computed.daily)} por dia.
          </p>
          <p className="line flex items-center justify-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${PULSE_DOT[pulse.level]}`} />
            NOVA Pulse — {pulse.label}
          </p>
          <p className="cap mt-1">{pulse.message}</p>
          {cards.length === 0 && (
            <Link to="/app/cards" className="mt-3 inline-block text-xs font-bold underline text-[var(--color-text-dim)]">
              Adicionar meu primeiro cartão
            </Link>
          )}
        </div>
        <button type="button" className="sc-cta" onClick={() => setShowQuickEntry(true)}>
          Registrar gasto
        </button>
      </section>

      <section className="sc-sum-section">
        <div className="sc-wrap">
          <h2 className="sc-title">Resumo do mês</h2>
          <div className="sc-sum">
            <div className="sc-sum-card">
              <p className="k">Entradas</p>
              <p className="v">{formatCurrency(computed.monthIncome)}</p>
              <div className="bar in">
                <i style={{ width: `${barMax ? (computed.monthIncome / barMax) * 100 : 0}%` }} />
              </div>
              <p className="k">Gastos</p>
              <p className="v">{formatCurrency(computed.monthExpenses)}</p>
              <div className="bar out">
                <i style={{ width: `${barMax ? (computed.monthExpenses / barMax) * 100 : 0}%` }} />
              </div>
            </div>
            <div className={savings >= 0 ? 'sc-sum-left' : 'sc-sum-left short'}>
              <div>
                <p className="k">{savings >= 0 ? 'Sobrou' : 'Faltou'}</p>
                <p className="big">{formatCurrency(Math.abs(savings))}</p>
              </div>
              <div className="tip">
                <p>{primaryRecommendation(transactions)}</p>
                {alerts[0] && (
                  <p>
                    {alerts[0].icon} {alerts[0].message} <Link to="/app/alerts">Ver alertas{alerts.length > 1 ? ` (${alerts.length})` : ''}</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {mainGoal && (
        <section className="sc-mine">
          <div className="sc-wrap">
            <h2 className="sc-title">Sua meta prioritária</h2>
            <Link to={isTravelGoal ? '/app/goals/travel' : '/app/goals'} className="block">
              <Panel>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {mainGoal.image ? (
                      <img src={mainGoal.image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <span className="text-xl shrink-0">{mainGoal.priority ? '⭐' : mainGoal.emoji}</span>
                    )}
                    <p className="font-display font-bold truncate">{mainGoal.name}</p>
                  </div>
                  <p className="text-sm text-[var(--color-text-dim)] shrink-0">{Math.round(((mainGoal.saved || 0) / mainGoalTotal) * 100)}%</p>
                </div>
                <ProgressBar value={mainGoal.saved || 0} max={mainGoalTotal} animateOnMount glowNearComplete />
                <p className="text-sm text-[var(--color-text-dim)] mt-3">
                  {formatCurrency(mainGoal.saved || 0)} de {formatCurrency(mainGoalTotal)}
                  {destinationCountry && destinationRate != null && (
                    <> (~{(mainGoalTotal * destinationRate).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} {destinationCountry.currencyCode})</>
                  )}
                </p>
                {isTravelGoal && (
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span
                      className={
                        onTrack === false ? 'text-[var(--color-negative)]' : onTrack === true ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-dim)]'
                      }
                    >
                      {onTrack === false ? '⚠️ atrás do ritmo' : onTrack === true ? '✓ no ritmo' : phase?.label ?? ''}
                    </span>
                    {projected && <span className="text-[var(--color-text-dim)]">Previsão: {formatDateLong(projected)}</span>}
                  </div>
                )}
              </Panel>
            </Link>
          </div>
        </section>
      )}

      <section className="sc-shortcuts">
        <div className="sc-short-grid">
          <Link to="/app/copilot" className="sc-short" data-tone="a">
            <span className="icon">
              <Sparkles size={22} strokeWidth={1.8} />
            </span>
            <div className="tx">
              <h3>Copilot</h3>
              <p className="sub">pergunte ou registre um gasto</p>
            </div>
            <ChevronRight size={20} className="go" />
          </Link>
          <Link to="/app/can-i-buy" className="sc-short" data-tone="b">
            <span className="icon">
              <ShoppingBag size={22} strokeWidth={1.8} />
            </span>
            <div className="tx">
              <h3>Posso comprar?</h3>
              <p className="sub">veja se a compra cabe</p>
            </div>
            <ChevronRight size={20} className="go" />
          </Link>
          <Link to="/app/reports/monthly-close" className="sc-short" data-tone="c">
            <span className="icon">
              <CalendarCheck size={22} strokeWidth={1.8} />
            </span>
            <div className="tx">
              <h3>Fechamento do mês</h3>
              <p className="sub">totais e sugestões de corte</p>
            </div>
            <ChevronRight size={20} className="go" />
          </Link>
        </div>
      </section>

      <button
        onClick={() => setShowQuickEntry(true)}
        aria-label="Registrar gasto"
        className="fixed z-40 right-6 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-8 w-14 h-14 rounded-full bg-[var(--color-ink)] hover:bg-[var(--color-accent)] text-white shadow-lg flex items-center justify-center transition-colors"
      >
        <Plus size={26} />
      </button>

      {showQuickEntry && <QuickExpenseEntry onClose={() => setShowQuickEntry(false)} />}
    </div>
  );
}
