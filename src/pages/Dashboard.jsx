import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Panel from '../components/Panel';
import StatNumber from '../components/StatNumber';
import ProgressBar from '../components/ProgressBar';
import { formatCurrency, formatDate, nextSalaryDate } from '../utils/format';
import { pulseStatus } from '../services/financeService';
import { primaryRecommendation } from '../services/insightsService';

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
  const mainGoal = goals[0];
  const savings = computed.monthIncome - computed.monthExpenses;

  return (
    // Mobile-first order (spec section 3): greeting → balance → available
    // money → NOVA Pulse → main goal → month summary → Copilot. Desktop
    // reflows the secondary rows into 2-column grids but keeps this order.
    <div className="space-y-6">
      <p className="text-[var(--color-text-dim)]">
        {greeting()}, {user?.name?.split(' ')[0]}
      </p>

      <Panel className="text-center py-12">
        <StatNumber
          label="Saldo disponível"
          value={formatCurrency(computed.totalBalance)}
          size="xl"
          sub="+12,4% em relação ao mês passado"
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
        <Link to="/app/goals">
          <Panel>
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium">
                {mainGoal.emoji} {mainGoal.name}
              </p>
              <p className="text-sm text-[var(--color-text-dim)]">
                {Math.round((mainGoal.saved / mainGoal.target) * 100)}%
              </p>
            </div>
            <ProgressBar value={mainGoal.saved} max={mainGoal.target} />
            <p className="text-sm text-[var(--color-text-dim)] mt-3">
              {formatCurrency(mainGoal.saved)} de {formatCurrency(mainGoal.target)}
            </p>
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

      <Link to="/app/copilot">
        <Panel className="hover:border-[var(--color-accent)] transition-colors">
          <p className="font-medium mb-1">Copilot</p>
          <p className="text-sm text-[var(--color-text-dim)]">{primaryRecommendation(transactions)}</p>
        </Panel>
      </Link>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/app/can-i-buy">
          <Panel className="hover:border-[var(--color-accent)] transition-colors">
            <p className="font-medium">Posso comprar?</p>
            <p className="text-sm text-[var(--color-text-dim)] mt-1">
              Descubra se uma compra cabe no seu orçamento.
            </p>
          </Panel>
        </Link>
        {alerts[0] && (
          <Panel>
            <p className="font-medium mb-2">Alertas</p>
            <p className="text-sm text-[var(--color-text-dim)]">
              {alerts[0].icon} {alerts[0].message}
            </p>
          </Panel>
        )}
      </div>
    </div>
  );
}
