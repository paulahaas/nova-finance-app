import { useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import Input from '../../components/Input';
import ProgressBar from '../../components/ProgressBar';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canAddCard } from '../../config/permissions';
import { formatCurrency } from '../../utils/format';

export default function Cards() {
  const { user } = useAuth();
  const { cards, addCard } = useData();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');

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
    if (!name.trim()) return;
    addCard({ name, limit: Number(limit) || 0 });
    setName('');
    setLimit('');
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Meus cartões</h1>

      <div className="space-y-4">
        {cards.map((card) => {
          const available = card.limit - card.used;
          return (
            <Panel key={card.id}>
              <div className="flex justify-between items-start mb-4 gap-3">
                <p className="font-medium">{card.name}</p>
                <p className="text-sm text-[var(--color-text-dim)] text-right shrink-0">
                  Fatura vence dia {card.dueDay ?? 10}
                </p>
              </div>
              <ProgressBar value={card.used} max={card.limit} />
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
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--color-border)] text-sm">
                <div>
                  <p className="text-[var(--color-text-dim)]">Fatura atual</p>
                  <p className="tabular font-medium">{formatCurrency(card.currentInvoice)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-dim)]">Próxima fatura</p>
                  <p className="tabular font-medium">{formatCurrency(card.nextInvoice)}</p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {showAdd ? (
        <Panel>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input autoFocus placeholder="Nome do cartão" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Limite"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
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
