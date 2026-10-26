import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plane } from 'lucide-react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateLong } from '../../utils/format';

const inputClass =
  'rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] w-full';

function toInputDate(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function GoalCard({ goal, onSave, onRemove }) {
  const g = goal;
  // The Intercâmbio goal keeps its targets in two phases and is edited on its own page.
  const isTravel = Array.isArray(g.countries);
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [form, setForm] = useState({ name: g.name, target: String(g.target), saved: String(g.saved ?? 0), deadline: toInputDate(g.deadline) });
  const pct = g.target ? Math.round(((g.saved || 0) / g.target) * 100) : 0;

  function save(e) {
    e.preventDefault();
    const target = Number(String(form.target).replace(',', '.'));
    const saved = Number(String(form.saved).replace(',', '.')) || 0;
    if (!form.name.trim() || !(target > 0) || !form.deadline) return;
    const deadline = new Date(`${form.deadline}T12:00:00`).toISOString();
    const months = Math.max(1, Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
    onSave(g.id, {
      name: form.name.trim(),
      target,
      saved,
      deadline,
      monthlyContribution: Math.max(0, target - saved) / months,
    });
    setEditing(false);
  }

  return (
    <Panel>
      {editing ? (
        <form onSubmit={save} className="flex flex-col gap-3">
          <input aria-label="Nome da meta" className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input aria-label="Valor da meta" type="number" inputMode="decimal" min="0" className={inputClass} value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
            <input aria-label="Já guardado" type="number" inputMode="decimal" min="0" className={inputClass} value={form.saved} onChange={(e) => setForm((f) => ({ ...f, saved: e.target.value }))} />
          </div>
          <input aria-label="Prazo" type="date" className={inputClass} value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
          <div className="flex gap-3">
            <Button type="submit">Salvar</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {g.image ? <img src={g.image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" /> : <span className="text-xl shrink-0">{g.emoji}</span>}
              <p className="font-display font-bold truncate">{g.name}</p>
            </div>
            <p className="text-sm text-[var(--color-text-dim)] shrink-0">{pct}%</p>
          </div>
          <ProgressBar value={g.saved || 0} max={g.target} animateOnMount glowNearComplete />
          <div className="flex justify-between mt-3 text-sm text-[var(--color-text-dim)]">
            <span>
              {formatCurrency(g.saved || 0)} de {formatCurrency(g.target)}
            </span>
            <span>Previsão: {formatDateLong(g.deadline)}</span>
          </div>
          <div className="flex justify-end gap-4 mt-3 text-xs">
            {isTravel ? (
              <Link to="/app/goals/travel" className="text-[var(--color-accent)] min-h-[32px] flex items-center">
                Abrir
              </Link>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="text-[var(--color-accent)] min-h-[32px]">
                Editar
              </button>
            )}
            {confirmRemove ? (
              <button type="button" onClick={() => onRemove(g.id)} className="text-[var(--color-negative)] font-semibold min-h-[32px]">
                Confirmar remoção
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmRemove(true)} className="text-[var(--color-text-faint)] min-h-[32px]">
                Remover
              </button>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

export default function Goals() {
  const { goals, updateGoal, removeGoal } = useData();
  const priorityGoal = goals.find((g) => g.priority);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Minhas metas</h1>

      <Link to="/app/goals/travel" className="block">
        <Panel className="flex items-center gap-4 hover:border-[var(--color-accent)] transition-colors shimmer-border">
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-accent-soft)] shrink-0">
            <Plane size={20} className="text-[var(--color-accent)]" />
          </span>
          <div className="flex-1">
            <p className="font-medium">{priorityGoal ? `⭐ ${priorityGoal.name}` : 'Criar meta prioritária: Intercâmbio'}</p>
            <p className="text-sm text-[var(--color-text-dim)]">
              {priorityGoal ? 'Fases, países e checklist do intercâmbio.' : 'Fases, comparação de países e checklist com prazos.'}
            </p>
          </div>
          <ChevronRight size={18} className="text-[var(--color-text-faint)] shrink-0" />
        </Panel>
      </Link>

      <div className="space-y-4">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} onSave={updateGoal} onRemove={removeGoal} />
        ))}
      </div>

      <Button as={Link} to="/app/goals/new" variant="outline" className="w-full">
        + Nova meta
      </Button>
    </div>
  );
}
