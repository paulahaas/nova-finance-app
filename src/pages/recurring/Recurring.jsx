import { useState } from 'react';
import clsx from 'clsx';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import Input from '../../components/Input';
import SelectMenu from '../../components/SelectMenu';
import { useData } from '../../contexts/DataContext';
import { dueDateIn, firstMonthFor, monthKey, monthlyTotals, nextDueDate } from '../../services/recurringBillsService';
import { formatCurrency } from '../../utils/format';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Saída' },
  { value: 'income', label: 'Entrada' },
];
const EMPTY_FORM = { name: '', amount: '', dayOfMonth: '', type: 'expense', category: 'Moradia', includeThisMonth: false };

function shortDate(date) {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

export default function Recurring() {
  const { recurringBills, categories, addRecurringBill, updateRecurringBill, setRecurringBillActive, removeRecurringBill } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);

  const totals = monthlyTotals(recurringBills);
  const categoryOptions = categories.map((c) => ({ value: c, label: c }));
  const day = Number(form.dayOfMonth);
  const validDay = day >= 1 && day <= 31;
  const dayAlreadyPassed = validDay && firstMonthFor(day) !== monthKey(new Date());

  function handleCreate(e) {
    e.preventDefault();
    const amount = Number(String(form.amount).replace(',', '.'));
    if (!form.name.trim() || !(amount > 0) || !validDay) return;
    addRecurringBill({
      name: form.name.trim(),
      amount,
      dayOfMonth: day,
      type: form.type,
      category: form.category,
      includeThisMonth: dayAlreadyPassed && form.includeThisMonth,
    });
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  function saveAmount(bill) {
    const amount = Number(String(editValue).replace(',', '.'));
    if (amount > 0) updateRecurringBill(bill.id, { amount });
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contas fixas</h1>
        <p className="text-sm text-[var(--color-text-dim)] mt-1">
          Cadastre uma vez. O NOVA lança sozinho todo mês, no dia combinado, sem você digitar de novo.
        </p>
      </div>

      {recurringBills.length > 0 && (
        <Panel className="!p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--color-text-dim)] mb-1">Saídas fixas por mês</p>
              <p className="font-semibold tabular">{formatCurrency(totals.expense)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-dim)] mb-1">Entradas fixas por mês</p>
              <p className="font-semibold tabular text-[var(--color-positive)]">{formatCurrency(totals.income)}</p>
            </div>
          </div>
        </Panel>
      )}

      <div className="space-y-3">
        {recurringBills.map((bill) => {
          const paused = bill.active === false;
          const isIncome = bill.type === 'income';
          return (
            <Panel key={bill.id} className={clsx('!p-4', paused && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{bill.name}</p>
                  <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
                    Todo dia {bill.dayOfMonth} · {isIncome ? 'Entrada' : bill.category}
                    {paused ? ' · Pausada' : ''}
                  </p>
                </div>
                <p className={clsx('tabular font-medium shrink-0', isIncome && 'text-[var(--color-positive)]')}>
                  {isIncome ? '+' : '−'} {formatCurrency(bill.amount)}
                </p>
              </div>

              {editing === bill.id ? (
                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    autoFocus
                    min="0"
                    step="0.01"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Novo valor"
                    className="flex-1 min-w-0 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
                  />
                  <Button onClick={() => saveAmount(bill)} className="!px-4">
                    Salvar
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(null)} className="!px-3">
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 mt-3">
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {paused ? 'Não será lançada enquanto estiver pausada' : `Próximo lançamento: ${shortDate(nextDueDate(bill))}`}
                  </p>
                  <div className="flex gap-3 shrink-0 text-xs">
                    <button
                      onClick={() => {
                        setEditing(bill.id);
                        setEditValue(String(bill.amount));
                      }}
                      className="text-[var(--color-accent)] min-h-[32px]"
                    >
                      Editar valor
                    </button>
                    <button onClick={() => setRecurringBillActive(bill.id, paused)} className="text-[var(--color-text-dim)] min-h-[32px]">
                      {paused ? 'Retomar' : 'Pausar'}
                    </button>
                    {confirmRemove === bill.id ? (
                      <button
                        onClick={() => {
                          removeRecurringBill(bill.id);
                          setConfirmRemove(null);
                        }}
                        className="text-[var(--color-negative)] min-h-[32px]"
                      >
                        Confirmar remoção
                      </button>
                    ) : (
                      <button onClick={() => setConfirmRemove(bill.id)} className="text-[var(--color-text-faint)] min-h-[32px]">
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Panel>
          );
        })}

        {recurringBills.length === 0 && !showAdd && (
          <Panel className="text-center">
            <p className="text-sm text-[var(--color-text-dim)]">
              Nenhuma conta fixa ainda. Aluguel, internet, plano de saúde, até um salário que cai todo mês: cadastre aqui e
              deixe o NOVA lançar sozinho.
            </p>
          </Panel>
        )}
      </div>

      {showAdd ? (
        <Panel>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input
              autoFocus
              placeholder="Nome (ex.: Aluguel, Internet)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="Valor"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                placeholder="Dia do mês"
                value={form.dayOfMonth}
                onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: opt.value }))}
                  className={clsx(
                    'flex-1 rounded-xl border px-3 py-3 text-sm transition-colors min-h-[44px]',
                    form.type === opt.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.type === 'expense' && (
              <SelectMenu value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={categoryOptions} />
            )}
            {dayAlreadyPassed && (
              <label className="flex items-start gap-3 text-sm text-[var(--color-text-dim)]">
                <input
                  type="checkbox"
                  checked={form.includeThisMonth}
                  onChange={(e) => setForm((f) => ({ ...f, includeThisMonth: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-[var(--color-accent)]"
                />
                <span>
                  Lançar também o deste mês (o dia {day} já passou, dia {shortDate(dueDateIn({ dayOfMonth: day }, monthKey(new Date())))}).
                  Deixe desmarcado se você já anotou esse mês.
                </span>
              </label>
            )}
            <p className="text-xs text-[var(--color-text-faint)]">Dia 31 vira o último dia dos meses mais curtos.</p>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Adicionar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Panel>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
          + Nova conta fixa
        </Button>
      )}
    </div>
  );
}
