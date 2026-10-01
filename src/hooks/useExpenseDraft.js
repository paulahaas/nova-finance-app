import { useState } from 'react';
import { parseExpense } from '../services/aiService';
import { looksLikeExpenseMessage } from '../services/expenseParser';
import { formatCurrency } from '../utils/format';

/**
 * Shared "gastei 45 no ifood" flow: interpret a chat message as a possible
 * transaction (create/correct/delete), hold it as a draft for her to
 * confirm or cancel, then write it. Used by both the Copilot chat and the
 * quick-entry button on Home so neither duplicates the logic.
 */
export function useExpenseDraft({ getIdToken, data }) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  /** @returns {boolean} whether the message was handled as a transaction command (a draft was set, or nothing to do). false means: treat it as a normal chat message instead. */
  async function interpret(message) {
    if (!looksLikeExpenseMessage(message)) return false;
    setBusy(true);
    try {
      const localOptions = { cards: data.cards, userRules: data.userCategoryRules, recentTransactions: data.transactions };
      const result = await parseExpense({ message, getIdToken, localOptions });
      if (result.intent === 'none') return false;
      setDraft(result);
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!draft) return null;
    setBusy(true);
    try {
      let summary = '';
      if (draft.intent === 'create') {
        const { transaction } = draft;
        await data.addTransaction(transaction);
        const n = transaction.installmentsTotal ?? 1;
        summary = `Registrei: ${transaction.description}, ${formatCurrency(Math.abs(transaction.amount))}${n > 1 ? ` em ${n}x` : ''}, categoria ${transaction.category}.`;
      } else if (draft.intent === 'delete') {
        await data.removeTransaction(draft.transaction.id);
        summary = `Apaguei "${draft.transaction.description}" (${formatCurrency(Math.abs(draft.transaction.amount))}).`;
      } else if (draft.intent === 'correct') {
        await data.updateTransaction(draft.transaction.id, draft.patch);
        const parts = [];
        if (draft.patch.amount !== undefined) parts.push(`valor pra ${formatCurrency(Math.abs(draft.patch.amount))}`);
        if (draft.patch.category) parts.push(`categoria pra ${draft.patch.category}`);
        summary = `Corrigi "${draft.transaction.description}": ${parts.join(' e ')}.`;
      }
      setDraft(null);
      return summary;
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setDraft(null);
  }

  /** Lets the confirmation card edit the proposed transaction before saving. */
  function editDraftTransaction(patch) {
    setDraft((d) => (d && d.transaction ? { ...d, transaction: { ...d.transaction, ...patch } } : d));
  }

  return { draft, busy, interpret, confirm, cancel, editDraftTransaction };
}
