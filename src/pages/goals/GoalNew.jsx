import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateLong } from '../../utils/format';

const SCENARIOS = [500, 750, 1000, 1500];

export default function GoalNew() {
  const { addGoal } = useData();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [initial, setInitial] = useState('');
  const [deadline, setDeadline] = useState('');

  const remaining = Math.max(0, Number(target || 0) - Number(initial || 0));

  function projectedDate(monthly) {
    if (!monthly) return null;
    const months = Math.ceil(remaining / monthly);
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const finalDeadline = deadline || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
    const finalTarget = Number(target) || 0;
    const finalSaved = Number(initial) || 0;
    const months = Math.max(1, Math.ceil((new Date(finalDeadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
    addGoal({
      name,
      emoji: '🎯',
      target: finalTarget,
      saved: finalSaved,
      deadline: finalDeadline,
      // Stored once at creation so it doesn't recompute (and balloon) as
      // the deadline approaches — see services/financeService.js.
      monthlyContribution: Math.max(0, finalTarget - finalSaved) / months,
    });
    navigate('/app/goals');
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Nova meta</h1>

      <Panel>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            placeholder="Nome da meta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            required
            type="number"
            inputMode="decimal"
            placeholder="Valor da meta"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Valor inicial (opcional)"
            value={initial}
            onChange={(e) => setInitial(e.target.value)}
            className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <Button type="submit">Criar meta</Button>
        </form>
      </Panel>

      {remaining > 0 && (
        <Panel>
          <p className="font-medium mb-4">Quanto guardar por mês</p>
          <div className="space-y-3">
            {SCENARIOS.map((s) => {
              const date = projectedDate(s);
              return (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span className="tabular">{formatCurrency(s)}/mês</span>
                  <span className="text-[var(--color-text-dim)]">{date && formatDateLong(date)}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
