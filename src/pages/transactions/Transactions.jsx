import { useMemo, useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import SelectMenu from '../../components/SelectMenu';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDate } from '../../utils/format';
import clsx from 'clsx';

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'income', label: 'Entradas' },
  { id: 'expense', label: 'Saídas' },
];

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Saída' },
  { value: 'income', label: 'Entrada' },
];

export default function Transactions() {
  const { transactions, banks, categories, addTransaction, updateTransaction, removeTransaction } = useData();
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filter, setFilter] = useState('all');
  const [bankFilter, setBankFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: categories[0], type: 'expense' });

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));
  const bankFilterOptions = [{ value: 'all', label: 'Todos os bancos' }, ...banks.map((b) => ({ value: b.id, label: b.name }))];
  const categoryFilterOptions = [{ value: 'all', label: 'Todas as categorias' }, ...categoryOptions];

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (bankFilter !== 'all' && t.bankId !== bankFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filter, bankFilter, categoryFilter]);

  function startEdit(t) {
    const d = new Date(t.date);
    const pad = (n) => String(n).padStart(2, '0');
    setEditingId(t.id);
    setConfirmDelete(false);
    setEdit({
      description: t.description,
      amount: String(Math.abs(t.amount)),
      category: t.category,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    });
  }

  async function saveEdit(t) {
    const amount = Number(String(edit.amount).replace(',', '.'));
    if (!edit.description.trim() || !(amount > 0) || !edit.date) return;
    await updateTransaction(t.id, {
      description: edit.description.trim(),
      amount: t.type === 'income' ? amount : -amount,
      category: t.type === 'income' ? 'Entrada' : edit.category,
      date: new Date(`${edit.date}T12:00:00`).toISOString(),
    });
    setEditingId(null);
  }

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
        {!showAdd && <Button onClick={() => setShowAdd(true)}>+ Adicionar transação</Button>}
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
            <SelectMenu
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
              options={TYPE_OPTIONS}
            />
            <SelectMenu
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              options={categoryOptions}
              triggerClassName={
                form.type === 'income'
                  ? 'flex items-center justify-between gap-2 w-full min-h-[44px] rounded-xl px-4 py-3.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text-faint)] opacity-40 pointer-events-none'
                  : undefined
              }
            />
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" className="flex-1">
                Salvar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              'rounded-full px-4 min-h-[40px] text-sm border transition-colors',
              filter === f.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]'
                : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
            )}
          >
            {f.label}
          </button>
        ))}
        <SelectMenu value={bankFilter} onChange={setBankFilter} options={bankFilterOptions} pill />
        <SelectMenu value={categoryFilter} onChange={setCategoryFilter} options={categoryFilterOptions} pill />
      </div>

      <div className="space-y-2">
        {filtered.map((t) =>
          editingId === t.id ? (
            <Panel key={t.id} className="!p-4">
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  aria-label="Descrição"
                  value={edit.description}
                  onChange={(e) => setEdit((f) => ({ ...f, description: e.target.value }))}
                  className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
                <input
                  aria-label="Valor"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={edit.amount}
                  onChange={(e) => setEdit((f) => ({ ...f, amount: e.target.value }))}
                  className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
                <input
                  aria-label="Data"
                  type="date"
                  value={edit.date}
                  onChange={(e) => setEdit((f) => ({ ...f, date: e.target.value }))}
                  className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
                {t.type === 'income' ? (
                  <p className="text-sm text-[var(--color-text-dim)] self-center">Entrada</p>
                ) : (
                  <SelectMenu value={edit.category} onChange={(v) => setEdit((f) => ({ ...f, category: v }))} options={categoryOptions} />
                )}
              </div>
              {t.installmentGroupId && (
                <p className="text-xs text-[var(--color-text-faint)] mt-3">Esta é uma parcela de uma compra parcelada: a alteração vale só para ela.</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Button onClick={() => saveEdit(t)}>Salvar</Button>
                <Button variant="ghost" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDelete) {
                      removeTransaction(t.id);
                      setEditingId(null);
                    } else {
                      setConfirmDelete(true);
                    }
                  }}
                  className="ml-auto text-sm font-semibold text-[var(--color-negative)] min-h-[44px]"
                >
                  {confirmDelete ? 'Confirmar: apagar' : 'Apagar'}
                </button>
              </div>
            </Panel>
          ) : (
            <Panel key={t.id} className="!p-0">
              <button type="button" onClick={() => startEdit(t)} className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left" aria-label={`Editar ${t.description}`}>
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.description}</p>
                  <p className="text-sm text-[var(--color-text-dim)]">
                    {t.category} · {formatDate(t.date)}
                  </p>
                </div>
                <p className={clsx('tabular font-medium shrink-0', t.amount >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-text)]')}>
                  {t.amount >= 0 ? '+ ' : '− '}
                  {formatCurrency(Math.abs(t.amount))}
                </p>
              </button>
            </Panel>
          )
        )}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-dim)] py-10">Nenhuma transação encontrada.</p>
        )}
      </div>
    </div>
  );
}
