import { useState } from 'react';
import clsx from 'clsx';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import Input from '../../components/Input';
import ProgressBar from '../../components/ProgressBar';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canAddCard } from '../../config/permissions';
import { formatCurrency } from '../../utils/format';

const TYPE_LABEL = { credit: 'Crédito', debit: 'Débito', both: 'Crédito e débito' };
const TYPE_OPTIONS = [
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' },
  { value: 'both', label: 'Ambos' },
];

export default function Cards() {
  const { user } = useAuth();
  const { cards, banks, addCard } = useData();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', bankId: '', type: 'credit', limit: '', dueDay: '' });

  const permission = canAddCard(user, cards.length);

  function handleAddClick() {
    if (!permission.allowed) {
      setShowUpgrade(true);
      return;
    }
    setShowAdd(true);
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const hasCredit = form.type !== 'debit';
    addCard({
      name: form.name,
      bankId: form.bankId || null,
      type: form.type,
      limit: hasCredit ? Number(form.limit) || 0 : 0,
      dueDay: hasCredit ? Number(form.dueDay) || null : null,
    });
    setForm({ name: '', bankId: '', type: 'credit', limit: '', dueDay: '' });
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Meus cartões</h1>

      <div className="space-y-4">
        {cards.map((card) => (
          <CardFlip key={card.id} card={card} bank={banks.find((b) => b.id === card.bankId)} />
        ))}
      </div>

      {showAdd ? (
        <Panel>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input
              autoFocus
              placeholder="Nome do cartão"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            {banks.length > 0 && (
              <select
                value={form.bankId}
                onChange={(e) => setForm((f) => ({ ...f, bankId: e.target.value }))}
                className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3.5 outline-none"
              >
                <option value="">Sem banco vinculado</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            <div>
              <p className="text-sm text-[var(--color-text-dim)] mb-1.5">Tipo</p>
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
            </div>

            {form.type !== 'debit' && (
              <>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Limite"
                  value={form.limit}
                  onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="31"
                  placeholder="Dia de vencimento da fatura"
                  value={form.dueDay}
                  onChange={(e) => setForm((f) => ({ ...f, dueDay: e.target.value }))}
                />
              </>
            )}

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
        <Button variant="outline" className="w-full" onClick={handleAddClick}>
          + Adicionar cartão
        </Button>
      )}

      {showUpgrade && (
        <UpgradeSheet
          title="Limite de cartões atingido"
          description="No plano Free você pode ter até 3 cartões. Faça upgrade para o NOVA Pro e tenha cartões ilimitados."
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}

// Each card type gets its own interaction (per the redesign brief) — for
// cards it's a tap-to-flip: the front is the at-a-glance summary, the back
// is the billing detail. Absolutely-positioned faces need a shared fixed
// height, so this stays its own component instead of inline JSX.
function CardFlip({ card, bank }) {
  const [flipped, setFlipped] = useState(false);
  const hasCredit = card.type !== 'debit';
  const available = hasCredit ? card.limit - card.used : null;

  return (
    <div
      className="[perspective:1200px] cursor-pointer select-none"
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
      aria-label={`Cartão ${card.name}, toque para ${flipped ? 'ver frente' : 'ver detalhes da fatura'}`}
    >
      <div
        className={clsx(
          'relative min-h-[230px] transition-transform duration-500 [transform-style:preserve-3d]',
          flipped && '[transform:rotateY(180deg)]'
        )}
      >
        {/* Front */}
        <Panel className="absolute inset-0 [backface-visibility:hidden] flex flex-col">
          <div className="flex justify-between items-start mb-3 gap-3">
            <div>
              <p className="font-medium">{card.name}</p>
              <p className="text-xs text-[var(--color-text-dim)]">
                {TYPE_LABEL[card.type] ?? 'Crédito'}
                {bank ? ` · ${bank.name}` : ''}
              </p>
            </div>
            <span className="text-[var(--color-text-faint)] text-xs shrink-0">Toque para virar ↻</span>
          </div>

          {hasCredit ? (
            <>
              <ProgressBar value={card.used} max={card.limit || 1} />
              <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 text-sm">
                <div>
                  <p className="text-[var(--color-text-dim)] text-xs md:text-sm">Limite</p>
                  <p className="tabular font-medium text-sm md:text-base">{formatCurrency(card.limit)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-dim)] text-xs md:text-sm">Utilizado</p>
                  <p className="tabular font-medium text-sm md:text-base">{formatCurrency(card.used)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-dim)] text-xs md:text-sm">Disponível</p>
                  <p className="tabular font-medium text-sm md:text-base">{formatCurrency(available)}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-dim)] mt-2">
              Débito direto {bank ? `da conta ${bank.name}` : 'da conta vinculada'} — sem limite ou fatura.
            </p>
          )}
        </Panel>

        {/* Back */}
        <Panel className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-center">
          {hasCredit ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">Fatura atual</span>
                <span className="tabular font-medium">{formatCurrency(card.currentInvoice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-dim)]">Próxima fatura</span>
                <span className="tabular font-medium">{formatCurrency(card.nextInvoice)}</span>
              </div>
              <div className="flex justify-between text-sm pt-4 border-t border-[var(--color-border)]">
                <span className="text-[var(--color-text-dim)]">Vencimento</span>
                <span className="font-medium">{card.dueDay ? `Dia ${card.dueDay}` : '—'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-dim)] text-center">
              Cartões de débito não geram fatura — os gastos saem direto do saldo{bank ? ` da ${bank.name}` : ''}.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
