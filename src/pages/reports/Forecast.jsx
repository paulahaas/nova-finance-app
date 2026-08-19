import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Panel from '../../components/Panel';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { forecastBalance } from '../../services/financeService';
import { canUseAdvancedInsights } from '../../config/permissions';
import { formatCurrency, formatCompact } from '../../utils/format';
import clsx from 'clsx';

const RANGES = [
  { id: 1, label: '1 mês' },
  { id: 3, label: '3 meses' },
  { id: 6, label: '6 meses' },
  { id: 12, label: '12 meses' },
];

export default function Forecast() {
  const { user } = useAuth();
  const { computed } = useData();
  const [range, setRange] = useState(3);
  const advanced = canUseAdvancedInsights(user);

  const points = useMemo(
    () =>
      forecastBalance({
        currentBalance: computed.totalBalance,
        avgMonthlyIncome: computed.monthIncome,
        avgMonthlyExpense: computed.monthExpenses,
        months: range,
      }),
    [computed, range]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Previsão financeira</h1>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={clsx(
              'shrink-0 rounded-full px-4 py-2 min-h-[40px] text-sm border transition-colors',
              range === r.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Panel>
        <p className="text-sm text-[var(--color-text-dim)] mb-1">Saldo projetado em {range} {range === 1 ? 'mês' : 'meses'}</p>
        <p className="text-3xl font-semibold tabular mb-6">
          {formatCurrency(points[points.length - 1]?.balance ?? computed.totalBalance)}
        </p>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={points} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} stroke="var(--color-text-faint)" fontSize={12} />
              <YAxis tickFormatter={formatCompact} stroke="var(--color-text-faint)" fontSize={12} width={60} />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                labelFormatter={(m) => `Mês ${m}`}
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12 }}
              />
              <Area type="monotone" dataKey="balance" stroke="var(--color-accent)" fill="url(#forecastFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {!advanced && (
        <Panel className="text-center">
          <p className="text-sm text-[var(--color-text-dim)]">
            Previsões avançadas (considerando sazonalidade e comportamento histórico) estão disponíveis no NOVA Pro.
          </p>
        </Panel>
      )}
    </div>
  );
}
