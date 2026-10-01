import { useMemo, useState } from 'react';
import clsx from 'clsx';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { useData } from '../../contexts/DataContext';
import { CATEGORIES } from '../../config/categories';
import { categorySpendThisMonth, suggestMonthlyBudget, budgetStatus } from '../../services/budgetService';
import { formatCurrency } from '../../utils/format';

const STATUS_TEXT = {
  ok: 'text-[var(--color-text-faint)]',
  warning: 'text-[var(--color-warning)]',
  over: 'text-[var(--color-negative)]',
};

export default function Budgets() {
  const { transactions, categoryBudgets, setCategoryBudget, removeCategoryBudget } = useData();
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState('');

  const rows = useMemo(() => {
    return CATEGORIES.map((category) => {
      const limit = categoryBudgets.find((b) => b.id === category)?.monthlyLimit ?? 0;
      const spent = categorySpendThisMonth(transactions, category);
      return { category, limit, spent, suggestion: suggestMonthlyBudget(transactions, category), status: budgetStatus(spent, limit) };
    }).sort((a, b) => b.spent - a.spent);
  }, [transactions, categoryBudgets]);

  const overCount = rows.filter((r) => r.status.level === 'over').length;
  const warningCount = rows.filter((r) => r.status.level === 'warning').length;

  function startEdit(row) {
    setEditing(row.category);
    setValue(row.limit ? String(row.limit) : row.suggestion ? String(row.suggestion) : '');
  }

  function save(category) {
    const n = Number(String(value).replace(',', '.'));
    if (n > 0) setCategoryBudget(category, n);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orçamento por categoria</h1>

      {(overCount > 0 || warningCount > 0) && (
        <Panel className="!p-4">
          <p className="text-sm">
            {overCount > 0 && (
              <span className="text-[var(--color-negative)]">
                {overCount} categoria{overCount > 1 ? 's' : ''} acima do limite
              </span>
            )}
            {overCount > 0 && warningCount > 0 && <span className="text-[var(--color-text-faint)]"> · </span>}
            {warningCount > 0 && <span className="text-[var(--color-warning)]">{warningCount} perto do limite</span>}
          </p>
        </Panel>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <Panel key={row.category} className="!p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="font-medium">{row.category}</p>
              <p className="text-sm tabular text-[var(--color-text-dim)]">
                {formatCurrency(row.spent)}
                {row.limit > 0 && ` de ${formatCurrency(row.limit)}`}
              </p>
            </div>

            {editing === row.category ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Limite mensal"
                  className="flex-1 min-w-0 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
                />
                <Button onClick={() => save(row.category)} className="!px-4">
                  Salvar
                </Button>
                <Button variant="ghost" onClick={() => setEditing(null)} className="!px-3">
                  Cancelar
                </Button>
              </div>
            ) : row.limit > 0 ? (
              <>
                <ProgressBar
                  value={row.spent}
                  max={row.limit}
                  tone={row.status.level === 'over' ? 'negative' : row.status.level === 'warning' ? 'warning' : 'accent'}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className={clsx('text-xs', STATUS_TEXT[row.status.level])}>
                    {row.status.pct}% do orçamento
                    {row.status.level === 'over' ? ' — acima do limite' : row.status.level === 'warning' ? ' — quase lá' : ''}
                  </p>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => startEdit(row)} className="text-xs text-[var(--color-accent)] min-h-[32px]">
                      Editar
                    </button>
                    <button onClick={() => removeCategoryBudget(row.category)} className="text-xs text-[var(--color-text-faint)] min-h-[32px]">
                      Remover
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={() => startEdit(row)} className="text-sm text-[var(--color-accent)] min-h-[36px]">
                + Definir limite{row.suggestion > 0 ? ` (sugestão: ${formatCurrency(row.suggestion)}/mês)` : ''}
              </button>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
