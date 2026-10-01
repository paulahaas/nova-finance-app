import { useState } from 'react';
import { Mic } from 'lucide-react';
import clsx from 'clsx';
import Panel from './Panel';
import Button from './Button';
import TransactionDraftCard from './TransactionDraftCard';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useExpenseDraft } from '../hooks/useExpenseDraft';
import { useSpeechToText } from '../hooks/useSpeechToText';

/** Bottom-sheet shortcut from Home: register a transaction without opening
 * the full Copilot chat. Same interpret-then-confirm flow as the chat. */
export default function QuickExpenseEntry({ onClose }) {
  const { getIdToken } = useAuth();
  const data = useData();
  const expense = useExpenseDraft({ getIdToken, data });
  const voice = useSpeechToText();
  const [input, setInput] = useState('');
  const [notUnderstood, setNotUnderstood] = useState(false);
  const [done, setDone] = useState('');

  async function handleSubmit(text) {
    const message = text.trim();
    if (!message || expense.busy) return;
    setInput('');
    setNotUnderstood(false);
    const handled = await expense.interpret(message);
    if (!handled) setNotUnderstood(true);
  }

  async function handleConfirm() {
    const summary = await expense.confirm();
    if (summary) setDone(summary);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full md:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 pb-safe animate-fade-in-up">
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--color-graphite)] md:hidden" />
        <h2 className="text-xl font-semibold mb-1">Registrar gasto</h2>
        <p className="text-sm text-[var(--color-text-dim)] mb-6">Diga o que gastou, tipo "gastei 45 no ifood".</p>

        {done ? (
          <Panel className="text-center">
            <p className="text-sm mb-4">{done}</p>
            <Button className="w-full" onClick={onClose}>
              Fechar
            </Button>
          </Panel>
        ) : expense.draft ? (
          <TransactionDraftCard
            draft={expense.draft}
            busy={expense.busy}
            onConfirm={handleConfirm}
            onCancel={expense.cancel}
            onEditTransaction={expense.editDraftTransaction}
          />
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(input);
              }}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex.: uber 18,90 ontem"
                className="flex-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-5 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
              />
              {voice.supported && (
                <button
                  type="button"
                  onClick={() => voice.start((transcript) => handleSubmit(transcript))}
                  aria-label="Ditar por voz"
                  className={clsx(
                    'shrink-0 w-12 h-12 rounded-full border flex items-center justify-center transition-colors',
                    voice.listening
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] animate-pulse-soft'
                      : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
                  )}
                >
                  <Mic size={18} />
                </button>
              )}
              <Button type="submit" disabled={expense.busy}>
                {expense.busy ? '...' : 'Ir'}
              </Button>
            </form>
            {notUnderstood && (
              <p className="mt-3 text-sm text-[var(--color-negative)]">
                Não entendi como um gasto. Tenta algo como "gastei 45 no ifood" ou "uber 18,90 ontem".
              </p>
            )}
            <Button variant="ghost" className="w-full mt-4" onClick={onClose}>
              Cancelar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
