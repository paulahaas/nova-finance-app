import Panel from './Panel';
import Button from './Button';
import SelectMenu from './SelectMenu';
import { CATEGORIES, INCOME_CATEGORY } from '../config/categories';
import { firstMonthFor, monthKey } from '../services/recurringBillsService';
import { formatCurrency, formatDate } from '../utils/format';

const CATEGORY_OPTIONS = [...CATEGORIES, INCOME_CATEGORY].map((c) => ({ value: c, label: c }));

/**
 * The confirmation step for a chat-interpreted transaction — nothing from
 * useExpenseDraft() is ever saved without her tapping Confirmar here.
 */
export default function TransactionDraftCard({ draft, busy, onConfirm, onCancel, onEditTransaction, onEditBill }) {
  if (!draft) return null;

  if (draft.intent === 'recurring') {
    const b = draft.bill;
    const passed = firstMonthFor(b.dayOfMonth) !== monthKey(new Date());
    const fieldClass = 'rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]';
    return (
      <Panel className="shimmer-border">
        <p className="text-sm text-[var(--color-text-dim)] mb-3">Entendi como conta fixa, que se repete todo mês. Confirma?</p>
        <div className="flex flex-col gap-3">
          <input aria-label="Nome" value={b.name} onChange={(e) => onEditBill({ name: e.target.value })} className={fieldClass} />
          <div className="grid grid-cols-2 gap-3">
            <input
              aria-label="Valor"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={b.amount}
              onChange={(e) => onEditBill({ amount: Math.abs(Number(e.target.value) || 0) })}
              className={fieldClass}
            />
            <input
              aria-label="Dia do mês"
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              value={b.dayOfMonth}
              onChange={(e) => onEditBill({ dayOfMonth: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
              className={fieldClass}
            />
          </div>
          <p className="text-xs text-[var(--color-text-faint)]">
            {b.type === 'income' ? 'Entrada' : `Saída · ${b.category}`} · lançada sozinha todo dia {b.dayOfMonth}
          </p>
          {passed && (
            <label className="flex items-start gap-3 text-xs text-[var(--color-text-dim)]">
              <input type="checkbox" checked={b.includeThisMonth} onChange={(e) => onEditBill({ includeThisMonth: e.target.checked })} className="mt-0.5 w-4 h-4 accent-[var(--color-accent)]" />
              <span>Lançar também o deste mês (o dia {b.dayOfMonth} já passou). Deixe desmarcado se você já anotou.</span>
            </label>
          )}
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={onConfirm} disabled={busy || !b.name.trim() || !(b.amount > 0)}>
            {busy ? 'Salvando...' : 'Confirmar'}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </Panel>
    );
  }

  if (draft.intent === 'delete_unresolved' || draft.intent === 'correct_unresolved') {
    return (
      <Panel className="shimmer-border">
        <p className="text-sm mb-4">Não encontrei nenhuma transação recente que bata com isso. Pode me dizer de outro jeito?</p>
        <Button variant="ghost" onClick={onCancel}>
          Fechar
        </Button>
      </Panel>
    );
  }

  if (draft.intent === 'delete') {
    const t = draft.transaction;
    return (
      <Panel className="shimmer-border">
        <p className="text-sm text-[var(--color-text-dim)] mb-2">Apagar esta transação?</p>
        <p className="font-medium">{t.description}</p>
        <p className="text-sm text-[var(--color-text-dim)] mb-4">
          {formatDate(t.date)} · {formatCurrency(Math.abs(t.amount))}
        </p>
        <div className="flex gap-3">
          <Button onClick={onConfirm} disabled={busy} className="!bg-[var(--color-negative)] hover:!bg-[var(--color-negative)]">
            {busy ? 'Apagando...' : 'Apagar'}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </Panel>
    );
  }

  if (draft.intent === 'correct') {
    const t = draft.transaction;
    const nextAmount = draft.patch.amount ?? t.amount;
    const nextCategory = draft.patch.category ?? t.category;
    return (
      <Panel className="shimmer-border">
        <p className="text-sm text-[var(--color-text-dim)] mb-2">Corrigir "{t.description}"?</p>
        <div className="flex items-center gap-2 text-sm mb-1">
          <span className="text-[var(--color-text-faint)] line-through">{formatCurrency(Math.abs(t.amount))}</span>
          <span>→</span>
          <span className="font-medium">{formatCurrency(Math.abs(nextAmount))}</span>
        </div>
        {draft.patch.category && (
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-[var(--color-text-faint)] line-through">{t.category}</span>
            <span>→</span>
            <span className="font-medium">{nextCategory}</span>
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? 'Salvando...' : 'Confirmar'}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </Panel>
    );
  }

  // intent === 'create'
  const t = draft.transaction;
  return (
    <Panel className="shimmer-border">
      <p className="text-sm text-[var(--color-text-dim)] mb-3">Entendi isso — confirma?</p>
      <div className="flex flex-col gap-3">
        <input
          value={t.description}
          onChange={(e) => onEditTransaction({ description: e.target.value })}
          className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={Math.abs(t.amount)}
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              onEditTransaction({ amount: t.type === 'income' ? v : -v });
            }}
            className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <SelectMenu
            value={t.category}
            onChange={(category) => onEditTransaction({ category })}
            options={CATEGORY_OPTIONS}
          />
        </div>
        <p className="text-xs text-[var(--color-text-faint)]">
          {formatDate(t.date)} · {t.type === 'income' ? 'entrada' : 'saída'}
          {t.installmentsTotal > 1 ? ` · em ${t.installmentsTotal}x de ${formatCurrency(Math.abs(t.amount) / t.installmentsTotal)}` : ''}
        </p>
      </div>
      <div className="flex gap-3 mt-4">
        <Button onClick={onConfirm} disabled={busy}>
          {busy ? 'Salvando...' : 'Confirmar'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </Panel>
  );
}
