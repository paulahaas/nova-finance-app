import { useMemo, useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDate } from '../../utils/format';
import clsx from 'clsx';

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'income', label: 'Entradas' },
  { id: 'expense', label: 'Saídas' },
];

export default function Transactions() {
  const { transactions, banks, categories, addTransaction } = useData();
  const [filter, setFilter] = useState('all');
  const [bankFilter, setBankFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: categories[0], type: 'expense' });

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (bankFilter !== 'all' && t.bankId !== bankFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [transactions, filter, bankFilter, categoryFilter]);

  function handleSubmit(e) {
    e.preventDefault();
    const amount = Number(form.amount) || 0;
    addTransaction({
      description: form.description,
      category: form.type === 'income' ? 'Entrada' : form.category,
      amount: form.type === 'income' ? amount : -Math.abs(amount),
      type: form.type,
      bankId: banks[0]?.id,
    });
    setForm({ description: '', amount: '', category: categories[0], type: 'expense' });
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transações</h1>
        <Button onClick={() => setShowAdd((v) => !v)}>+ Adicionar transação</Button>
      </div>

      {showAdd && (
        <Panel>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
            <input
              required
              placeholder="Descrição"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <input
              required
              type="number"
              inputMode="decimal"
              placeholder="Valor"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
            >
              <option value="expense">Saída</option>
              <option value="income">Entrada</option>
            </select>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
              disabled={form.type === 'income'}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button type="submit" className="md:col-span-2">
              Salvar
            </Button>
          </form>
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm border transition-colors',
              filter === f.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]'
                : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
            )}
          >
            {f.label}
          </button>
        ))}
        <select
          value={bankFilter}
          onChange={(e) => setBankFilter(e.target.value)}
          className="rounded-full px-4 py-1.5 text-sm border border-[var(--color-border)] bg-transparent text-[var(--color-text-dim)]"
        >
          <option value="all">Todos os bancos</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-full px-4 py-1.5 text-sm border border-[var(--color-border)] bg-transparent text-[var(--color-text-dim)]"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((t) => (
          <Panel key={t.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{t.description}</p>
              <p className="text-sm text-[var(--color-text-dim)]">
                {t.category} · {formatDate(t.date)}
              </p>
            </div>
            <p
              className={clsx(
                'tabular font-medium',
                t.amount >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-text)]'
              )}
            >
              {t.amount >= 0 ? '+ ' : '− '}
              {formatCurrency(Math.abs(t.amount))}
            </p>
          </Panel>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-dim)] py-10">Nenhuma transação encontrada.</p>
        )}
      </div>
    </div>
  );
}
