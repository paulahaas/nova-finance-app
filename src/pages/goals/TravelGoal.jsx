import { useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { estimateCountry } from '../../services/aiService';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { primaryGoal } from '../../services/financeService';
import {
  DEFAULT_TRAVEL_CHECKLIST,
  travelGoalTotal,
  travelGoalPhase,
  travelGoalOnTrack,
  travelGoalProjectedDate,
  selectedCountry,
} from '../../services/travelGoalService';
import { formatCurrency, formatDateLong } from '../../utils/format';

const inputClass =
  'w-full rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]';
const smallInputClass =
  'flex-1 min-w-0 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]';

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function SetupForm({ onCreate, creating }) {
  const [name, setName] = useState('Intercâmbio 2027');
  const [phase1, setPhase1] = useState('');
  const [phase2, setPhase2] = useState('');
  const [deadline, setDeadline] = useState('2027-05-01');

  function handleSubmit(e) {
    e.preventDefault();
    onCreate({ name, phase1Target: Number(phase1) || 0, phase2Target: Number(phase2) || 0, deadline });
  }

  return (
    <Panel>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-text-dim)]">
          Divida em duas fases: o que você precisa pra sair e se sustentar até o primeiro salário lá, e o que quer
          trazer de volta pro Brasil (ex.: comprar um carro).
        </p>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da meta" className={inputClass} />
        <div>
          <label className="text-sm text-[var(--color-text-dim)]">Fase 1 — ida e sustento até o 1º salário</label>
          <input
            required
            type="number"
            inputMode="decimal"
            value={phase1}
            onChange={(e) => setPhase1(e.target.value)}
            placeholder="R$ 0,00"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--color-text-dim)]">Fase 2 — trazer de volta (ex.: carro)</label>
          <input
            required
            type="number"
            inputMode="decimal"
            value={phase2}
            onChange={(e) => setPhase2(e.target.value)}
            placeholder="R$ 0,00"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--color-text-dim)]">Prazo (data prevista pra sair)</label>
          <input required type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${inputClass} mt-1`} />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? 'Criando...' : 'Criar meta prioritária'}
        </Button>
      </form>
    </Panel>
  );
}

function CountryForm({ onSave }) {
  const { getIdToken } = useAuth();
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [costToArriveBRL, setCostToArriveBRL] = useState('');
  const [monthlyEarningLocal, setMonthlyEarningLocal] = useState('');
  const [monthlySavingLocal, setMonthlySavingLocal] = useState('');
  const [notes, setNotes] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState('');

  async function askAi() {
    if (!name.trim()) {
      setError('Digite o nome do país primeiro.');
      return;
    }
    setEstimating(true);
    setError('');
    try {
      const estimate = await estimateCountry({ country: name.trim(), getIdToken });
      setCurrencyCode(estimate.currencyCode ?? '');
      setCostToArriveBRL(estimate.costToArriveBRL ?? '');
      setMonthlyEarningLocal(estimate.monthlyEarningLocal ?? '');
      setMonthlySavingLocal(estimate.monthlySavingLocal ?? '');
      setNotes(estimate.notes ?? '');
    } catch (err) {
      setError(err.message || 'Não consegui estimar esse país.');
    } finally {
      setEstimating(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !currencyCode.trim()) return;
    onSave({
      id: genId(),
      name: name.trim(),
      currencyCode: currencyCode.trim().toUpperCase(),
      costToArriveBRL: Number(costToArriveBRL) || 0,
      monthlyEarningLocal: Number(monthlyEarningLocal) || 0,
      monthlySavingLocal: Number(monthlySavingLocal) || 0,
      notes: notes.trim(),
    });
    setName('');
    setCurrencyCode('');
    setCostToArriveBRL('');
    setMonthlyEarningLocal('');
    setMonthlySavingLocal('');
    setNotes('');
  }

  return (
    <Panel className="!p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input placeholder="País (ex.: Irlanda)" value={name} onChange={(e) => setName(e.target.value)} className={smallInputClass} />
          <Button type="button" variant="outline" onClick={askAi} disabled={estimating} className="!px-4 text-xs shrink-0">
            {estimating ? 'Estimando...' : 'Pedir estimativa à IA'}
          </Button>
        </div>
        {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
        <div className="flex gap-2">
          <input
            placeholder="Moeda (ex.: EUR)"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            className={smallInputClass}
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Custo pra chegar (R$)"
            value={costToArriveBRL}
            onChange={(e) => setCostToArriveBRL(e.target.value)}
            className={smallInputClass}
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Ganho mensal estimado (moeda local)"
            value={monthlyEarningLocal}
            onChange={(e) => setMonthlyEarningLocal(e.target.value)}
            className={smallInputClass}
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Economia mensal estimada (moeda local)"
            value={monthlySavingLocal}
            onChange={(e) => setMonthlySavingLocal(e.target.value)}
            className={smallInputClass}
          />
        </div>
        <textarea
          placeholder="Observações (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
        />
        <p className="text-xs text-[var(--color-text-faint)]">
          Tudo aqui é estimativa, editável antes de salvar — confirme com fontes oficiais antes de decidir.
        </p>
        <Button type="submit" variant="outline" className="self-start !px-4 text-sm">
          + Adicionar país
        </Button>
      </form>
    </Panel>
  );
}

function CountryRow({ country, selected, onSelect, onRemove }) {
  const { rate, loading } = useExchangeRate(country.currencyCode, 'BRL');
  const savingInBRL = rate ? country.monthlySavingLocal * rate : null;

  return (
    <Panel className={`!p-4 ${selected ? 'border-[var(--color-accent)]' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-medium">
          {selected && '⭐ '}
          {country.name} <span className="text-[var(--color-text-faint)] font-normal">({country.currencyCode})</span>
        </p>
        <div className="flex gap-3 shrink-0 text-xs">
          <button onClick={() => onSelect(country.id)} className="text-[var(--color-accent)] min-h-[32px]">
            {selected ? 'Selecionado ✓' : 'Selecionar'}
          </button>
          <button onClick={() => onRemove(country.id)} className="text-[var(--color-text-faint)] min-h-[32px]">
            Remover
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-xs text-[var(--color-text-dim)]">Custo pra chegar</p>
          <p className="tabular">{formatCurrency(country.costToArriveBRL)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-dim)]">Ganho/mês</p>
          <p className="tabular">
            {country.monthlyEarningLocal} {country.currencyCode}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-dim)]">Economia/mês</p>
          <p className="tabular">
            {country.monthlySavingLocal} {country.currencyCode}
            {loading ? ' (convertendo...)' : savingInBRL != null ? ` (~${formatCurrency(savingInBRL)})` : ''}
          </p>
        </div>
      </div>
      {country.notes && <p className="text-xs text-[var(--color-text-faint)] mt-2">{country.notes}</p>}
    </Panel>
  );
}

function ChecklistSection({ goal, updateGoal }) {
  const checklist = goal.checklist ?? DEFAULT_TRAVEL_CHECKLIST;
  const [label, setLabel] = useState('');
  const [cost, setCost] = useState('');

  function toggle(id) {
    updateGoal(goal.id, { checklist: checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item)) });
  }
  function remove(id) {
    updateGoal(goal.id, { checklist: checklist.filter((item) => item.id !== id) });
  }
  function add(e) {
    e.preventDefault();
    if (!label.trim()) return;
    updateGoal(goal.id, { checklist: [...checklist, { id: genId(), label: label.trim(), done: false, cost: Number(cost) || 0, dueDate: null }] });
    setLabel('');
    setCost('');
  }

  const pendingCost = checklist.filter((i) => !i.done).reduce((s, i) => s + (i.cost || 0), 0);

  return (
    <Panel className="!p-4">
      <p className="font-medium mb-3">Checklist</p>
      <div className="space-y-2 mb-3">
        {checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} className="w-4 h-4 accent-[var(--color-accent)]" />
            <span className={`flex-1 text-sm ${item.done ? 'line-through text-[var(--color-text-faint)]' : ''}`}>{item.label}</span>
            {item.cost > 0 && <span className="text-xs text-[var(--color-text-dim)] tabular">{formatCurrency(item.cost)}</span>}
            <button onClick={() => remove(item.id)} className="text-xs text-[var(--color-text-faint)] min-h-[32px] px-1">
              ✕
            </button>
          </div>
        ))}
      </div>
      {pendingCost > 0 && (
        <p className="text-xs text-[var(--color-text-dim)] mb-3">Custo estimado do que falta: {formatCurrency(pendingCost)}</p>
      )}
      <form onSubmit={add} className="flex gap-2">
        <input placeholder="Novo item" value={label} onChange={(e) => setLabel(e.target.value)} className={smallInputClass} />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Custo (opcional)"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="w-32 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <Button type="submit" variant="outline" className="!px-4 text-xs shrink-0">
          + Item
        </Button>
      </form>
    </Panel>
  );
}

function Overview({ goal, updateGoal, contributeToGoal }) {
  const total = travelGoalTotal(goal);
  const phase = travelGoalPhase(goal);
  const onTrack = travelGoalOnTrack(goal);
  const projected = travelGoalProjectedDate(goal);
  const country = selectedCountry(goal);
  const { rate, loading: loadingRate } = useExchangeRate('BRL', country?.currencyCode);
  const [contribution, setContribution] = useState('');

  function handleContribute(e) {
    e.preventDefault();
    const amount = Number(contribution);
    if (!amount) return;
    contributeToGoal(goal.id, amount);
    setContribution('');
  }

  function selectCountry(id) {
    updateGoal(goal.id, { selectedCountryId: goal.selectedCountryId === id ? null : id });
  }
  function removeCountry(id) {
    const countries = (goal.countries ?? []).filter((c) => c.id !== id);
    const patch = { countries };
    if (goal.selectedCountryId === id) patch.selectedCountryId = null;
    updateGoal(goal.id, patch);
  }
  function addCountry(country) {
    updateGoal(goal.id, { countries: [...(goal.countries ?? []), country] });
  }

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex items-center justify-between mb-3 gap-3">
          <p className="font-medium">⭐ {goal.name}</p>
          <p className="text-sm text-[var(--color-text-dim)]">{Math.round(((goal.saved || 0) / total) * 100)}%</p>
        </div>
        <ProgressBar value={goal.saved || 0} max={total} animateOnMount glowNearComplete />
        <p className="text-sm text-[var(--color-text-dim)] mt-3">
          {formatCurrency(goal.saved || 0)} de {formatCurrency(total)}
          {country && rate && !loadingRate && ` (~${(total * rate).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ${country.currencyCode})`}
        </p>
        {phase && (
          <p className="text-sm mt-3">
            {phase.label} — faltam {formatCurrency(phase.remaining)}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className={onTrack === false ? 'text-[var(--color-negative)]' : onTrack === true ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-dim)]'}>
            {onTrack === false ? '⚠️ Atrás do ritmo planejado' : onTrack === true ? '✓ No ritmo planejado' : 'Ritmo: aguardando mais dados'}
          </span>
          {projected && <span className="text-[var(--color-text-dim)]">Previsão: {formatDateLong(projected)}</span>}
        </div>
        <form onSubmit={handleContribute} className="flex gap-2 mt-4">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Adicionar ao guardado (R$)"
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
            className={smallInputClass}
          />
          <Button type="submit" variant="outline" className="!px-4 text-xs shrink-0">
            Guardar
          </Button>
        </form>
      </Panel>

      <div>
        <p className="font-medium mb-3">Comparar países</p>
        <div className="space-y-3">
          {(goal.countries ?? []).map((c) => (
            <CountryRow key={c.id} country={c} selected={goal.selectedCountryId === c.id} onSelect={selectCountry} onRemove={removeCountry} />
          ))}
          <CountryForm onSave={addCountry} />
        </div>
      </div>

      <ChecklistSection goal={goal} updateGoal={updateGoal} />
    </div>
  );
}

export default function TravelGoal() {
  const { goals, addGoal, updateGoal, contributeToGoal } = useData();
  const goal = primaryGoal(goals);
  const hasTravelShape = goal && Array.isArray(goal.countries);
  const [creating, setCreating] = useState(false);

  async function handleCreate({ name, phase1Target, phase2Target, deadline }) {
    const deadlineIso = new Date(deadline).toISOString();
    const total = phase1Target + phase2Target;
    const months = Math.max(1, Math.ceil((new Date(deadlineIso) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
    setCreating(true);
    try {
      await Promise.all(goals.filter((g) => g.priority).map((g) => updateGoal(g.id, { priority: false })));
      await addGoal({
        name,
        emoji: '✈️',
        priority: true,
        phase1Target,
        phase2Target,
        target: total,
        deadline: deadlineIso,
        monthlyContribution: total / months,
        countries: [],
        selectedCountryId: null,
        checklist: DEFAULT_TRAVEL_CHECKLIST,
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Intercâmbio</h1>
      {hasTravelShape ? (
        <Overview goal={goal} updateGoal={updateGoal} contributeToGoal={contributeToGoal} />
      ) : (
        <SetupForm onCreate={handleCreate} creating={creating} />
      )}
    </div>
  );
}
