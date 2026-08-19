import { useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import { useData } from '../../contexts/DataContext';
import { evaluatePurchase } from '../../services/financeService';
import { formatCurrency } from '../../utils/format';

const VERDICT_UI = {
  good: { emoji: '🟢', label: 'Pode comprar tranquilamente.' },
  caution: { emoji: '🟡', label: 'Pode, mas não é recomendado agora.' },
  bad: { emoji: '🔴', label: 'Melhor não comprar agora.' },
};

export default function CanIBuy() {
  const { computed, goals } = useData();
  const [item, setItem] = useState('');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const priceNum = Number(price) || 0;
    const evaluation = evaluatePurchase({
      price: priceNum,
      available: computed.available,
      monthlyIncome: computed.monthIncome,
      goals,
    });
    setResult(evaluation);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Posso comprar?</h1>

      <Panel>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-[var(--color-text-dim)]">O que você quer comprar?</label>
            <input
              required
              placeholder="Ex: Notebook"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full mt-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-dim)]">Valor</label>
            <input
              required
              type="number"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full mt-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <Button type="submit">Analisar</Button>
        </form>
      </Panel>

      {result && (
        <Panel className="animate-fade-in-up">
          <p className="text-lg font-medium mb-2">
            {VERDICT_UI[result.verdict].emoji} {VERDICT_UI[result.verdict].label}
          </p>
          <p className="text-[var(--color-text-dim)] mb-4">{result.message}</p>
          {goals[0] && result.goalDelayDays > 0 && (
            <p className="text-sm text-[var(--color-text-dim)]">
              Sua meta "{goals[0].name}" será atrasada em aproximadamente {result.goalDelayDays} dias.
            </p>
          )}
          <p className="text-sm text-[var(--color-text-dim)] mt-2">
            Restante após a compra: {formatCurrency(result.remainingAfter)}
          </p>
        </Panel>
      )}
    </div>
  );
}
