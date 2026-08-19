import { useEffect, useState } from 'react';
import { PluggyConnect } from 'react-pluggy-connect';
import { Landmark } from 'lucide-react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import TiltCard from '../../components/TiltCard';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canAddBank } from '../../config/permissions';
import { getPlan } from '../../config/plans';
import { formatCurrency } from '../../utils/format';
import { getGatewayStatus, getConnectToken, syncItem } from '../../services/openFinanceService';

export default function Banks() {
  const { user, getIdToken } = useAuth();
  const { banks, accounts, addBank } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [name, setName] = useState('');

  const [openFinanceAvailable, setOpenFinanceAvailable] = useState(false);
  const [connectToken, setConnectToken] = useState(null);
  const [ofBusy, setOfBusy] = useState(false);
  const [ofError, setOfError] = useState('');

  const plan = getPlan(user?.plan);
  const isFree = plan.id === 'free';
  const permission = canAddBank(user, banks.length);

  useEffect(() => {
    getGatewayStatus().then((s) => setOpenFinanceAvailable(s.gatewayConfigured));
  }, []);

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

  async function handleConnectClick() {
    if (!permission.allowed) {
      setShowUpgrade(true);
      return;
    }
    setOfError('');
    setOfBusy(true);
    try {
      const token = await getConnectToken(getIdToken);
      setConnectToken(token);
    } catch (err) {
      setOfError(err.message);
    } finally {
      setOfBusy(false);
    }
  }

  async function handleConnectSuccess({ item }) {
    setConnectToken(null);
    setOfBusy(true);
    try {
      await syncItem(getIdToken, item.id);
      // New banks/accounts/transactions arrive via the Firestore
      // onSnapshot listeners in DataContext — nothing to update manually.
    } catch (err) {
      setOfError(err.message);
    } finally {
      setOfBusy(false);
    }
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
          <TiltCard key={bank.id}>
            <Panel className="flex items-center justify-between active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏦</span>
                <div>
                  <p className="font-medium">{bank.name}</p>
                  <p className="text-sm text-[var(--color-text-dim)]">
                    {bank.source === 'open-finance'
                      ? 'Conectado via Open Finance'
                      : (accountsFor(bank.id)[0]?.name ?? 'Conta principal')}
                  </p>
                </div>
              </div>
              <p className="font-medium tabular">{formatCurrency(bankBalance(bank.id))}</p>
            </Panel>
          </TiltCard>
        ))}
      </div>

      {ofError && <p className="text-sm text-[var(--color-negative)]">{ofError}</p>}

      {openFinanceAvailable && (
        <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleConnectClick} disabled={ofBusy}>
          <Landmark size={18} />
          {ofBusy ? 'Conectando...' : 'Conectar banco automaticamente (Open Finance)'}
        </Button>
      )}

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
          + Adicionar banco manualmente
        </Button>
      )}

      {showUpgrade && (
        <UpgradeSheet
          title="Seu limite gratuito foi atingido"
          description={`Você já conectou ${banks.length} bancos. Faça upgrade para o NOVA Pro e conecte quantos bancos quiser.`}
          onClose={() => setShowUpgrade(false)}
        />
      )}

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={false}
          onSuccess={handleConnectSuccess}
          onError={(err) => setOfError(err.message)}
          onClose={() => setConnectToken(null)}
        />
      )}
    </div>
  );
}
