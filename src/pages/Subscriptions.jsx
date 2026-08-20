import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import Panel from '../components/Panel';
import Button from '../components/Button';
import StatNumber from '../components/StatNumber';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/format';

const FREQUENCY_LABEL = { weekly: 'semanal', monthly: 'mensal', yearly: 'anual' };

export default function Subscriptions() {
  const {
    subscriptions,
    addSubscription,
    removeSubscription,
    recurringPatterns = [],
    acceptRecurringPattern,
    dismissRecurringPattern,
  } = useData();
  const suggestions = recurringPatterns.filter((p) => p.status === 'suggested');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const totalMonthly = subscriptions.reduce((s, sub) => s + sub.amount, 0);

  function handleSubmit(e) {
    e.preventDefault();
    addSubscription({ name, amount: Number(amount) || 0, cycle: 'monthly', category: 'Assinaturas' });
    setName('');
    setAmount('');
    setShowAdd(false);
  }

  function handleCancel(id) {
    if (!confirm('Cancelar essa assinatura? Ela deixa de contar no seu total mensal.')) return;
    removeSubscription(id);
    setExpandedId(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Assinaturas</h1>

      <Panel className="grid grid-cols-2 gap-4">
        <StatNumber label="Total mensal" value={formatCurrency(totalMonthly)} size="md" />
        <StatNumber label="Total anual" value={formatCurrency(totalMonthly * 12)} size="md" />
      </Panel>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-[var(--color-text-dim)]">Detectadas automaticamente</h2>
          {suggestions.map((p) => (
            <Panel key={p.id} className="shimmer-border !p-4 flex items-center gap-3">
              <Sparkles size={18} className="shrink-0 text-[var(--color-accent)]" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.description}</p>
                <p className="text-sm text-[var(--color-text-dim)]">
                  {formatCurrency(p.avgAmount)} · cobrança {FREQUENCY_LABEL[p.frequency] ?? p.frequency} · provavelmente recorrente
                  ({Math.round(p.confidence * 100)}%)
                </p>
              </div>
              <div className="shrink-0 flex gap-2">
                <Button variant="ghost" onClick={() => dismissRecurringPattern(p.id)}>
                  Ignorar
                </Button>
                <Button onClick={() => acceptRecurringPattern(p.id)}>Aceitar</Button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {subscriptions.map((s) => {
          const expanded = expandedId === s.id;
          return (
            <Panel key={s.id} className="!p-0 overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : s.id)}
                className="w-full flex items-center justify-between py-4 px-6 min-h-[56px] text-left"
              >
                <p className="font-medium">{s.name}</p>
                <div className="flex items-center gap-3">
                  <p className="tabular font-medium">{formatCurrency(s.amount)}</p>
                  <ChevronDown
                    size={18}
                    className={clsx('text-[var(--color-text-faint)] transition-transform', expanded && 'rotate-180')}
                  />
                </div>
              </button>
              <div
                className={clsx(
                  'grid transition-[grid-template-rows] duration-300 ease-out',
                  expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-5 flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4">
                    <p className="text-sm text-[var(--color-text-dim)]">
                      {s.category ?? 'Assinaturas'} · cobrança {s.cycle === 'monthly' ? 'mensal' : s.cycle}
                    </p>
                    <Button variant="outline" onClick={() => handleCancel(s.id)}>
                      Cancelar assinatura
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {showAdd ? (
        <Panel>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              required
              autoFocus
              placeholder="Nome da assinatura"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <input
              required
              type="number"
              inputMode="decimal"
              placeholder="Valor mensal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <div className="flex gap-3">
              <Button type="submit">Adicionar</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Panel>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
          + Adicionar assinatura
        </Button>
      )}
    </div>
  );
}
