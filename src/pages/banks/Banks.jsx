import { useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canAddBank } from '../../config/permissions';
import { getPlan } from '../../config/plans';
import { formatCurrency } from '../../utils/format';

export default function Banks() {
  const { user } = useAuth();
  const { banks, accounts, addBank } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [name, setName] = useState('');

  const plan = getPlan(user?.plan);
  const isFree = plan.id === 'free';
  const permission = canAddBank(user, banks.length);

  function accountsFor(bankId) {
    return accounts.filter((a) => a.bankId === bankId);
  }

  function bankBalance(bankId) {
    return accountsFor(bankId).reduce((s, a) => s + a.balance, 0);
  }

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
    addBank({ name, institution: name });
    setName('');
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meus bancos</h1>
        {isFree && (
          <span className="text-sm text-[var(--color-text-dim)]">
            {banks.length} de {plan.limits.maxBanks} bancos utilizados
          </span>
        )}
      </div>

      <div className="space-y-3">
        {banks.map((bank) => (
          <Panel key={bank.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏦</span>
              <div>
                <p className="font-medium">{bank.name}</p>
                <p className="text-sm text-[var(--color-text-dim)]">
                  {accountsFor(bank.id)[0]?.name ?? 'Conta principal'}
                </p>
              </div>
            </div>
            <p className="font-medium tabular">{formatCurrency(bankBalance(bank.id))}</p>
          </Panel>
        ))}
      </div>

      {showAdd ? (
        <Panel>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              autoFocus
              placeholder="Nome do banco"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <div className="flex gap-3">
              <Button type="submit">Adicionar</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Panel>
      ) : (
        <Button variant="outline" className="w-full" onClick={handleAddClick}>
          + Adicionar banco
        </Button>
      )}

      {showUpgrade && (
        <UpgradeSheet
          title="Seu limite gratuito foi atingido"
          description={`Você já conectou ${banks.length} bancos. Faça upgrade para o NOVA Pro e conecte quantos bancos quiser.`}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
