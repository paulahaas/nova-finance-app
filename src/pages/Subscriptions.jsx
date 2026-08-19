import { useState } from 'react';
import Panel from '../components/Panel';
import Button from '../components/Button';
import StatNumber from '../components/StatNumber';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/format';

export default function Subscriptions() {
  const { subscriptions, addSubscription } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const totalMonthly = subscriptions.reduce((s, sub) => s + sub.amount, 0);

  function handleSubmit(e) {
    e.preventDefault();
    addSubscription({ name, amount: Number(amount) || 0, cycle: 'monthly', category: 'Assinaturas' });
    setName('');
    setAmount('');
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Assinaturas</h1>

      <Panel className="grid grid-cols-2 gap-4">
        <StatNumber label="Total mensal" value={formatCurrency(totalMonthly)} size="md" />
        <StatNumber label="Total anual" value={formatCurrency(totalMonthly * 12)} size="md" />
      </Panel>

      <div className="space-y-2">
        {subscriptions.map((s) => (
          <Panel key={s.id} className="flex items-center justify-between py-4">
            <p className="font-medium">{s.name}</p>
            <p className="tabular font-medium">{formatCurrency(s.amount)}</p>
          </Panel>
        ))}
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
