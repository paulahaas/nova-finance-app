import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Panel from '../../components/Panel';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canUseAdvancedReports } from '../../config/permissions';
import { formatCurrency, formatCompact } from '../../utils/format';

const COLORS = ['#e11d2f', '#f5b942', '#34d399', '#a3a3a3', '#7f1420', '#6b6b6b'];

export default function Reports() {
  const { user } = useAuth();
  const { transactions, goals } = useData();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const advanced = canUseAdvancedReports(user);

  const byCategory = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const totalExpense = byCategory.reduce((s, c) => s + c.value, 0);
  const biggest = [...byCategory].sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <Link to="/app/forecast" className="text-sm text-[var(--color-accent)]">
          Ver previsão →
        </Link>
      </div>

      <Panel>
        <p className="font-medium mb-4">Gastos por categoria</p>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {byCategory.map((c, i) => (
            <div key={c.name} className="flex items-center gap-2 text-sm min-h-[28px]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[var(--color-text-dim)] truncate">{c.name}</span>
              <span className="ml-auto tabular shrink-0">{formatCurrency(c.value)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <p className="font-medium mb-4">Maiores gastos</p>
        <div className="space-y-2">
          {biggest.map((b) => (
            <div key={b.name} className="flex justify-between text-sm gap-3">
              <span className="truncate">{b.name}</span>
              <span className="tabular font-medium shrink-0">{formatCurrency(b.value)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <p className="font-medium mb-4">Evolução das metas</p>
        {/* Horizontal scroll only kicks in if there are enough goals that
            bars would otherwise get squeezed illegible on a small screen —
            not applied blindly to every chart. */}
        <div className="overflow-x-auto -mx-6 px-6">
          <div style={{ width: '100%', minWidth: Math.max(280, goals.length * 110), height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={goals.map((g) => ({ name: g.name, saved: g.saved, target: g.target }))}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-text-faint)"
                  fontSize={11}
                  tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)}
                />
                <YAxis tickFormatter={formatCompact} stroke="var(--color-text-faint)" fontSize={11} width={50} />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12 }}
                />
                <Bar dataKey="saved" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>

      {!advanced ? (
        <Panel className="text-center">
          <p className="text-sm text-[var(--color-text-dim)] mb-3">
            Comparação mensal, recorrências detalhadas e exportação de dados fazem parte dos relatórios avançados.
          </p>
          <button onClick={() => setShowUpgrade(true)} className="text-sm text-[var(--color-accent)] hover:underline">
            Desbloquear com o NOVA Pro →
          </button>
        </Panel>
      ) : (
        <Panel>
          <p className="font-medium mb-2">Comparação mensal</p>
          <p className="text-sm text-[var(--color-text-dim)]">
            Total de gastos este mês: {formatCurrency(totalExpense)} — dados completos disponíveis para exportação no seu perfil.
          </p>
        </Panel>
      )}

      {showUpgrade && (
        <UpgradeSheet
          title="Relatórios avançados são exclusivos do NOVA Pro"
          description="Comparações mensais, recorrências e exportação de dados."
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
