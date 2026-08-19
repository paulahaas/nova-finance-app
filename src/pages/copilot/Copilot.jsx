import { useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canUseCopilot } from '../../config/permissions';
import { getPlan, UNLIMITED } from '../../config/plans';
import { askCopilot } from '../../services/aiService';

const SUGGESTIONS = [
  'Posso comprar um notebook?',
  'Onde estou gastando demais?',
  'Quanto preciso guardar?',
  'Quando atingirei minha meta?',
  'Quanto terei daqui a um ano?',
  'Como economizar R$ 500?',
];

export default function Copilot() {
  const { user, updateUser } = useAuth();
  const { computed, goals } = useData();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Olá! Sou o Copilot da NOVA, seu assistente financeiro pessoal. Pergunte qualquer coisa sobre seu dinheiro.' },
  ]);
  const [input, setInput] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [sending, setSending] = useState(false);

  const plan = getPlan(user?.plan);
  const used = user?.aiMessagesUsed ?? 0;
  const permission = canUseCopilot(user, used);
  const limitIsUnlimited = plan.limits.aiMessagesPerMonth === UNLIMITED;

  async function send(text) {
    if (!text.trim()) return;
    if (!permission.allowed) {
      setShowUpgrade(true);
      return;
    }
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setSending(true);
    const { reply } = await askCopilot({
      message: text,
      context: {
        available: computed.available,
        monthlyIncome: computed.monthIncome,
        dailyBudget: computed.daily,
        goals,
      },
    });
    setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    updateUser({ aiMessagesUsed: used + 1 });
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Copilot</h1>
          <p className="text-sm text-[var(--color-text-dim)]">Seu assistente financeiro pessoal.</p>
        </div>
        {!limitIsUnlimited && (
          <span className="text-sm text-[var(--color-text-dim)]">
            {used}/{plan.limits.aiMessagesPerMonth} mensagens utilizadas
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Panel
              className={`max-w-[85%] py-3 ${
                m.role === 'user' ? 'bg-[var(--color-accent-soft)] border-[var(--color-accent-dim)]' : ''
              }`}
            >
              <p className="text-sm">{m.text}</p>
            </Panel>
          </div>
        ))}
        {sending && <p className="text-sm text-[var(--color-text-dim)] animate-pulse-soft">Copilot está digitando...</p>}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 my-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
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

      {showUpgrade && (
        <UpgradeSheet
          title="Você utilizou suas mensagens gratuitas deste mês"
          description="Faça upgrade para o NOVA Pro e tenha acesso ampliado ao Copilot."
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
