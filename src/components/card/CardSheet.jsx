import { useEffect, useState } from 'react';
import FlatCard from './FlatCard';
import { CARD_TYPES, CARD_COPY } from '../../config/cardTypes';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

/**
 * Adding a card asks for one thing: a name, in her own words ("Cartão
 * Nubank"). Editing a card lets her fill in the optional details, and remove it.
 */
export default function CardSheet({ mode, card, initialType = 'credit', onTypeChange, onClose, onSaved }) {
  const { user } = useAuth();
  const { addCard, updateCard, removeCard } = useData();
  const editing = mode === 'edit';
  const [name, setName] = useState(card?.name ?? '');
  const [type, setType] = useState(card?.type ?? initialType);
  const [limit, setLimit] = useState(card?.limit ? String(card.limit) : '');
  const [dueDay, setDueDay] = useState(card?.dueDay ? String(card.dueDay) : '');
  const [closingDay, setClosingDay] = useState(card?.closingDay ? String(card.closingDay) : '');
  const [invoice, setInvoice] = useState(card?.currentInvoice ? String(card.currentInvoice) : '');
  const [last4, setLast4] = useState(card?.last4 ?? '');
  const [expiry, setExpiry] = useState(card?.expiry ?? '');
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const hasCredit = type !== 'debit';

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function pickType(t) {
    setType(t);
    onTypeChange?.(t);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError('Dê um nome ao cartão, por exemplo: Cartão Nubank.');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updateCard(card.id, {
          name: clean,
          type,
          limit: hasCredit ? Number(limit) || 0 : 0,
          dueDay: hasCredit ? Number(dueDay) || null : null,
          closingDay: hasCredit ? Number(closingDay) || null : null,
          currentInvoice: hasCredit ? Number(invoice) || 0 : 0,
          last4: last4.replace(/\D/g, '').slice(0, 4) || null,
          expiry: expiry.trim() || null,
        });
        onSaved(`“${clean}” atualizado.`);
      } else {
        await addCard({ name: clean, type, bankId: null, limit: 0, dueDay: null, last4: null, expiry: null });
        onSaved(`“${clean}” adicionado (${CARD_COPY[type].label.toLowerCase()}). Limite e fatura são opcionais: informe só se quiser.`);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await removeCard(card.id);
      onSaved(`“${card.name}” removido. Os gastos já registrados continuam no histórico.`);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="sc-sheet-wrap"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sc-sheet" role="dialog" aria-modal="true" aria-labelledby="cardSheetTitle" data-sc-type={type}>
        <button type="button" className="x" aria-label="Fechar" onClick={onClose}>
          ×
        </button>
        <FlatCard type={type} nickname={name.trim()} last4={last4} expiry={expiry} holder={user?.name ?? ''} />
        <form onSubmit={handleSubmit} noValidate>
          <h3 id="cardSheetTitle">{editing ? 'Editar cartão' : 'Dê um nome ao cartão'}</h3>
          {!editing && <p className="hint">Pode ser do seu jeito: Cartão Nubank, Cartão Banco do Brasil…</p>}
          <label htmlFor="cardName" className="sr-only">
            Nome do cartão
          </label>
          <input
            id="cardName"
            type="text"
            maxLength={28}
            autoFocus
            autoComplete="off"
            placeholder="Ex.: Cartão Nubank"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
          />
          <p className="err" role="alert">
            {error}
          </p>
          <div className="types">
            {CARD_TYPES.map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => pickType(t)}>
                {CARD_COPY[t].label}
              </button>
            ))}
          </div>

          {editing && (
            <>
              <p className="opt-title">Opcional</p>
              {hasCredit && (
                <div className="opt">
                  <input type="number" inputMode="decimal" min="0" placeholder="Limite (R$)" aria-label="Limite" value={limit} onChange={(e) => setLimit(e.target.value)} />
                  <input type="number" inputMode="numeric" min="1" max="31" placeholder="Dia do vencimento" aria-label="Dia do vencimento" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
                  <input type="number" inputMode="numeric" min="1" max="31" placeholder="Dia do fechamento" aria-label="Dia do fechamento" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder="Fatura atual (R$)"
                    aria-label="Fatura atual"
                    value={invoice}
                    onChange={(e) => setInvoice(e.target.value)}
                  />
                </div>
              )}
              <div className="opt">
                <input inputMode="numeric" maxLength={4} placeholder="Últimos 4 dígitos" aria-label="Últimos 4 dígitos" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                <input inputMode="numeric" maxLength={5} placeholder="Validade (MM/AA)" aria-label="Validade" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
            </>
          )}

          <button type="submit" className="go" disabled={busy}>
            {editing ? 'Salvar' : 'Adicionar cartão'}
          </button>
          {editing ? (
            confirmRemove ? (
              <button type="button" className="danger" onClick={handleRemove} disabled={busy}>
                Confirmar: remover este cartão
              </button>
            ) : (
              <button type="button" className="danger" onClick={() => setConfirmRemove(true)}>
                Remover cartão
              </button>
            )
          ) : (
            <p className="note">Não precisa informar limite, fatura nem dados do banco. O NOVA não acessa sua conta: você passa os gastos pelo chat ou importando o extrato.</p>
          )}
          {editing && <p className="note">Nunca guardamos o número completo, o CVV nem a senha do cartão.</p>}
        </form>
      </div>
    </div>
  );
}
