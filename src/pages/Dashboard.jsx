import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Plus } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Panel from '../components/Panel';
import StatNumber from '../components/StatNumber';
import ProgressBar from '../components/ProgressBar';
import QuickExpenseEntry from '../components/QuickExpenseEntry';
import { formatCurrency, formatDate, formatDateLong, nextSalaryDate } from '../utils/format';
import { pulseStatus, primaryGoal } from '../services/financeService';
import { primaryRecommendation } from '../services/insightsService';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { travelGoalTotal, travelGoalPhase, travelGoalOnTrack, travelGoalProjectedDate, selectedCountry } from '../services/travelGoalService';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const PULSE_STYLES = {
  good: { dot: 'bg-[var(--color-positive)]', text: 'text-[var(--color-positive)]' },
  caution: { dot: 'bg-[var(--color-warning)]', text: 'text-[var(--color-warning)]' },
  alert: { dot: 'bg-[var(--color-negative)]', text: 'text-[var(--color-negative)]' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { computed, goals, alerts, transactions } = useData();
  const salary = nextSalaryDate(user?.payDay ?? 5);
  const pulse = pulseStatus({ available: computed.available, monthlyIncome: computed.monthIncome });
  const pulseStyle = PULSE_STYLES[pulse.level];
  const mainGoal = primaryGoal(goals);
  const isTravelGoal = mainGoal && Array.isArray(mainGoal.countries);
  const mainGoalTotal = isTravelGoal ? travelGoalTotal(mainGoal) : mainGoal?.target;
  const phase = isTravelGoal ? travelGoalPhase(mainGoal) : null;
  const onTrack = isTravelGoal ? travelGoalOnTrack(mainGoal) : null;
  const projected = isTravelGoal ? travelGoalProjectedDate(mainGoal) : null;
  const destinationCountry = isTravelGoal ? selectedCountry(mainGoal) : null;
  const { rate: destinationRate } = useExchangeRate('BRL', destinationCountry?.currencyCode);
  const savings = computed.monthIncome - computed.monthExpenses;
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  return (
    // Mobile-first order (spec section 3): greeting → balance → available
    // money → NOVA Pulse → main goal → month summary → Copilot. Desktop
    // reflows the secondary rows into 2-column grids but keeps this order.
    <div className="space-y-6 md:space-y-8">
      <p className="text-[var(--color-text-dim)]">
        {greeting()}, {user?.name?.split(' ')[0]}
      </p>

      <Panel className="text-center py-12">
        <StatNumber
          label="Saldo disponível"
          value={formatCurrency(computed.totalBalance)}
          size="xl"
        />
      </Panel>

      <Panel className="bg-[var(--color-surface-2)]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <StatNumber
            label="Você pode gastar até o próximo salário"
            value={formatCurrency(computed.available)}
            size="lg"
          />
          <p className="text-lg font-medium text-[var(--color-text-dim)] tabular">
            {formatCurrency(computed.daily)}
            <span className="text-sm">/dia</span>
          </p>
        </div>
        <div className="flex justify-between items-center mt-6 text-sm text-[var(--color-text-dim)]">
          <span>Próximo salário: {formatDate(salary)}</span>
          <span>{computed.daysToSalary} dias restantes</span>
        </div>
      </Panel>

      <Panel className="flex items-center gap-3">
        <span className={clsx('w-2.5 h-2.5 rounded-full shrink-0', pulseStyle.dot)} />
        <div>
          <p className={clsx('font-medium', pulseStyle.text)}>NOVA Pulse — {pulse.label}</p>
          <p className="text-sm text-[var(--color-text-dim)]">{pulse.message}</p>
        </div>
      </Panel>

      {mainGoal && (
        <Link to={isTravelGoal ? '/app/goals/travel' : '/app/goals'} className="block">
          <Panel>
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {mainGoal.image ? (
                  <img src={mainGoal.image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <span className="text-xl shrink-0">{mainGoal.priority ? '⭐' : mainGoal.emoji}</span>
                )}
                <p className="font-medium truncate">{mainGoal.name}</p>
              </div>
              <p className="text-sm text-[var(--color-text-dim)] shrink-0">
                {Math.round(((mainGoal.saved || 0) / mainGoalTotal) * 100)}%
              </p>
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
                    onTrack === false
                      ? 'text-[var(--color-negative)]'
                      : onTrack === true
                        ? 'text-[var(--color-positive)]'
                        : 'text-[var(--color-text-dim)]'
                  }
                >
                  {onTrack === false ? '⚠️ atrás do ritmo' : onTrack === true ? '✓ no ritmo' : phase?.label ?? ''}
                </span>
                {projected && <span className="text-[var(--color-text-dim)]">Previsão: {formatDateLong(projected)}</span>}
              </div>
            )}
          </Panel>
        </Link>
      )}

      <Panel>
        <p className="font-medium mb-4">Resumo do mês</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Entradas</p>
            <p className="font-semibold tabular text-sm md:text-base">{formatCurrency(computed.monthIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Gastos</p>
            <p className="font-semibold tabular text-sm md:text-base">{formatCurrency(computed.monthExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Economia</p>
            <p
              className={clsx(
                'font-semibold tabular text-sm md:text-base',
                savings >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
              )}
            >
              {formatCurrency(savings)}
            </p>
          </div>
        </div>
      </Panel>

      <Link to="/app/copilot" className="block">
        <Panel className="shimmer-border hover:border-[var(--color-accent)] transition-colors">
          <p className="font-medium mb-1">Copilot</p>
          <p className="text-sm text-[var(--color-text-dim)]">{primaryRecommendation(transactions)}</p>
        </Panel>
      </Link>

      <Link to="/app/can-i-buy" className="block">
        <Panel className="flex items-center gap-4 hover:border-[var(--color-accent)] transition-colors">
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-accent-soft)] shrink-0">
            <ShoppingBag size={20} className="text-[var(--color-accent)]" />
          </span>
          <div className="flex-1">
            <p className="font-medium">Posso comprar?</p>
            <p className="text-sm text-[var(--color-text-dim)]">Descubra se uma compra cabe no seu orçamento.</p>
          </div>
          <ChevronRight size={18} className="text-[var(--color-text-faint)] shrink-0" />
        </Panel>
      </Link>

      {alerts[0] && (
        <Link to="/app/alerts" className="block">
          <Panel className="hover:border-[var(--color-accent)] transition-colors">
            <p className="font-medium mb-2">Alertas{alerts.length > 1 ? ` (${alerts.length})` : ''}</p>
            <p className="text-sm text-[var(--color-text-dim)]">
              {alerts[0].icon} {alerts[0].message}
            </p>
          </Panel>
        </Link>
      )}

      <button
        onClick={() => setShowQuickEntry(true)}
        aria-label="Registrar gasto"
        className="fixed z-40 right-6 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-8 w-14 h-14 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-bright)] text-white shadow-lg flex items-center justify-center transition-colors"
      >
        <Plus size={26} />
      </button>

      {showQuickEntry && <QuickExpenseEntry onClose={() => setShowQuickEntry(false)} />}
    </div>
  );
}
