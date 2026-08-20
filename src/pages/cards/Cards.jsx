import { useState } from 'react';
import clsx from 'clsx';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import Input from '../../components/Input';
import SelectMenu from '../../components/SelectMenu';
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
  const [form, setForm] = useState({ name: '', bankId: '', type: 'credit', limit: '', dueDay: '', last4: '', expiry: '' });

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
      last4: form.last4.replace(/\D/g, '').slice(0, 4) || null,
      expiry: form.expiry.trim() || null,
    });
    setForm({ name: '', bankId: '', type: 'credit', limit: '', dueDay: '', last4: '', expiry: '' });
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
              <SelectMenu
                value={form.bankId}
                onChange={(v) => setForm((f) => ({ ...f, bankId: v }))}
                options={[{ value: '', label: 'Sem banco vinculado' }, ...banks.map((b) => ({ value: b.id, label: b.name }))]}
              />
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

            <div className="grid grid-cols-2 gap-3">
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder="Últimos 4 dígitos"
                value={form.last4}
                onChange={(e) => setForm((f) => ({ ...f, last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              />
              <Input
                inputMode="numeric"
                maxLength={5}
                placeholder="Validade (MM/AA)"
                value={form.expiry}
                onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
              />
            </div>
            {/* Deliberately no full card number or CVV field — this app
                tracks spending, it doesn't process payments, and CVV must
                never be stored anywhere under PCI-DSS. Last 4 digits +
                expiry is the same minimal identifier real banking/budget
                apps show; don't "complete" this form with more than that. */}

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
              {card.last4 && <p className="text-xs text-[var(--color-text-faint)] tabular mt-0.5">•••• {card.last4}</p>}
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
              {card.expiry && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-dim)]">Validade do cartão</span>
                  <span className="font-medium tabular">{card.expiry}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-sm text-[var(--color-text-dim)]">
                Cartões de débito não geram fatura — os gastos saem direto do saldo{bank ? ` da ${bank.name}` : ''}.
              </p>
              {card.expiry && <p className="text-sm font-medium tabular">Validade: {card.expiry}</p>}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
