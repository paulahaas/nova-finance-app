import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import FlatCard from '../../components/card/FlatCard';
import Panel from '../../components/Panel';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { cardInvoiceView } from '../../services/invoiceService';
import { dueDateIn, monthKey } from '../../services/recurringBillsService';
import { daysUntil, formatCurrency } from '../../utils/format';

function monthName(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
}
function dayLabel(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function PurchaseRows({ items }) {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {items.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <div className="min-w-0">
            <p className="truncate">{t.description}</p>
            <p className="text-xs text-[var(--color-text-faint)]">
              {dayLabel(t.date)} · {t.category}
            </p>
          </div>
          <p className="tabular font-medium shrink-0">{formatCurrency(Math.abs(t.amount))}</p>
        </div>
      ))}
    </div>
  );
}

export default function Invoices() {
  const { user } = useAuth();
  const { cards, transactions } = useData();
  const [selectedId, setSelectedId] = useState(null);

  if (cards.length === 0) {
    return (
      <Panel className="text-center">
        <p className="font-display font-bold mb-2">Faturas</p>
        <p className="text-sm text-[var(--color-text-dim)] mb-5">
          Cadastre um cartão (só o nome) e as compras que você registrar nele aparecem aqui, mês a mês.
        </p>
        <Link to="/app/cards" className="inline-block rounded-[6px] bg-[var(--color-ink)] px-6 py-3 text-sm font-display font-bold text-white">
          Adicionar cartão
        </Link>
      </Panel>
    );
  }

  const card = cards.find((c) => c.id === selectedId) ?? cards[0];
  const view = cardInvoiceView(transactions, card.id);
  const hasCredit = card.type !== 'debit';
  const pct = card.limit > 0 ? Math.round(((card.currentInvoice || 0) / card.limit) * 100) : null;
  const due = hasCredit && card.dueDay ? dueDateIn({ dayOfMonth: card.dueDay }, monthKey(new Date())) : null;
  const dueIn = due ? daysUntil(due) : null;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            className={clsx(
              'shrink-0 rounded-full border px-4 py-2 min-h-[40px] text-sm font-semibold transition-colors',
              c.id === card.id ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white' : 'border-[var(--color-border)] bg-white text-[var(--color-text-dim)]'
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <Panel>
        <div className="flex items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Lançado em {card.name}, em {monthName(view.current.key)}</p>
            <p className="font-display font-extrabold tabular text-4xl tracking-tight">{formatCurrency(view.current.total)}</p>
            {hasCredit && due && (
              <p className="text-sm text-[var(--color-text-dim)] mt-3">
                Vence dia {card.dueDay}
                {dueIn === 0 ? ' (hoje)' : dueIn != null ? `, em ${dueIn} dia${dueIn === 1 ? '' : 's'}` : ''}
              </p>
            )}
          </div>
          <FlatCard type={card.type || 'credit'} width={96} nickname={card.name} last4={card.last4 || ''} holder="" />
        </div>
        {hasCredit && pct != null && (
          <div className="mt-5">
            <ProgressBar value={card.currentInvoice || 0} max={card.limit} tone={pct >= 100 ? 'negative' : pct >= 70 ? 'warning' : 'accent'} />
            <p className="text-xs text-[var(--color-text-dim)] mt-2">
              Fatura informada: {formatCurrency(card.currentInvoice || 0)} de {formatCurrency(card.limit)} ({pct}% do limite)
            </p>
          </div>
        )}
        {hasCredit && pct == null && (
          <p className="text-xs text-[var(--color-text-faint)] mt-4">Quer ver quanto da fatura já foi? Informe o limite do cartão ao tocar nele em “Cartões”. É opcional.</p>
        )}
      </Panel>

      <Panel>
        <p className="font-display font-bold mb-1">Compras deste mês</p>
        {view.current.items.length === 0 ? (
          <p className="text-sm text-[var(--color-text-dim)]">
            Nada lançado neste cartão ainda. Diga ao Copilot, por exemplo: “gastei 45 no ifood no {card.name.toLowerCase()}”.
          </p>
        ) : (
          <PurchaseRows items={view.current.items} />
        )}
      </Panel>

      {view.upcoming.length > 0 && (
        <Panel>
          <p className="font-display font-bold mb-1">Parcelas a caminho</p>
          <div className="space-y-5 mt-3">
            {view.upcoming.map((m) => (
              <div key={m.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-semibold">{monthName(m.key)}</span>
                  <span className="tabular font-semibold">{formatCurrency(m.total)}</span>
                </div>
                <PurchaseRows items={m.items} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      <p className="text-xs text-[var(--color-text-faint)] text-center px-4">
        Estimativa feita só com o que você lançou{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. O NOVA não acessa o seu banco: a fatura oficial é a que o banco manda.
      </p>
    </div>
  );
}
