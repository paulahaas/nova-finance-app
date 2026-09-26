import { useEffect, useRef, useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { askCopilot } from '../../services/aiService';

const SUGGESTIONS = [
  'Posso comprar um notebook de 3000?',
  'Onde estou gastando demais?',
  'Quanto preciso guardar?',
  'Quando atingirei minha meta?',
  'Como estão minhas faturas?',
  'Quais são meus maiores gastos?',
  'Me dá um resumo do mês',
  'Me dá uma dica de economia',
];

const WELCOME = 'Olá! Sou o Copilot do NOVA. Eu conheço suas transações, cartões, metas e assinaturas — pergunte qualquer coisa sobre seu dinheiro.';

export default function Copilot() {
  const { getIdToken } = useAuth();
  const {
    computed,
    goals,
    transactions,
    cards,
    subscriptions,
    recurringPatterns = [],
    copilotMessages,
    addCopilotMessage,
    clearCopilotMessages,
  } = useData();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [copilotMessages.length, sending]);

  async function send(text) {
    const message = text.trim();
    if (!message || sending) return;
    const history = copilotMessages;
    setInput('');
    setSending(true);
    try {
      await addCopilotMessage({ role: 'user', text: message });
      const { reply, source } = await askCopilot({
        message,
        history,
        getIdToken,
        // Only used if the server/AI is unavailable (keyword fallback).
        context: {
          available: computed.available,
          monthlyIncome: computed.monthIncome,
          monthExpenses: computed.monthExpenses,
          dailyBudget: computed.daily,
          goals,
          transactions,
          cards,
          subscriptions,
          recurringPatterns: recurringPatterns.filter((p) => p.status === 'suggested'),
        },
      });
      await addCopilotMessage({ role: 'assistant', text: reply, basic: source === 'basic' });
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    if (!confirm('Apagar todo o histórico desta conversa?')) return;
    await clearCopilotMessages();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Copilot</h1>
          <p className="text-sm text-[var(--color-text-dim)]">Seu assistente financeiro pessoal.</p>
        </div>
        {copilotMessages.length > 0 && (
          <button onClick={handleClear} className="min-h-[44px] px-2 text-sm text-[var(--color-text-faint)] hover:text-[var(--color-text-dim)]">
            Limpar conversa
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {copilotMessages.length === 0 && (
          <div className="flex justify-start">
            <Panel className="max-w-[85%] py-3">
              <p className="text-sm">{WELCOME}</p>
            </Panel>
          </div>
        )}
        {copilotMessages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Panel
              className={`max-w-[85%] py-3 ${
                m.role === 'user' ? 'bg-[var(--color-accent-soft)] border-[var(--color-accent-dim)]' : ''
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              {m.basic && (
                <p className="mt-2 text-xs text-[var(--color-text-faint)]">Resposta básica — a IA não respondeu desta vez.</p>
              )}
            </Panel>
          </div>
        ))}
        {sending && <p className="text-sm text-[var(--color-text-dim)] animate-pulse-soft">Copilot está pensando...</p>}
        <div ref={bottomRef} />
      </div>

      {copilotMessages.length === 0 && (
        <div className="flex flex-wrap gap-2 my-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-[var(--color-border)] px-3 py-2 min-h-[36px] text-xs text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte qualquer coisa sobre seu dinheiro..."
          className="flex-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-5 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <Button type="submit" disabled={sending}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
