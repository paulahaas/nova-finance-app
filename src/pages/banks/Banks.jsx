import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PluggyConnect } from 'react-pluggy-connect';
import { Landmark, Upload } from 'lucide-react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import TiltCard from '../../components/TiltCard';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils/format';
import { getGatewayStatus, getConnectToken, syncItem } from '../../services/openFinanceService';

export default function Banks() {
  const { getIdToken } = useAuth();
  const { banks, accounts, addBank, renameBank, removeBank } = useData();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');

  const [openFinanceAvailable, setOpenFinanceAvailable] = useState(false);
  const [connectToken, setConnectToken] = useState(null);
  const [ofBusy, setOfBusy] = useState(false);
  const [ofError, setOfError] = useState('');

  useEffect(() => {
    getGatewayStatus().then((s) => setOpenFinanceAvailable(s.gatewayConfigured));
  }, []);

  function accountsFor(bankId) {
    return accounts.filter((a) => a.bankId === bankId);
  }

  function bankBalance(bankId) {
    return accountsFor(bankId).reduce((s, a) => s + a.balance, 0);
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    addBank({ name, institution: name });
    setName('');
    setShowAdd(false);
  }

  async function handleConnectClick() {
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
      </div>

      <div className="space-y-3">
        {banks.map((bank) => (
          <TiltCard key={bank.id}>
            <Panel className="active:scale-[0.98] transition-transform">
              {renamingId === bank.id ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (renameValue.trim()) renameBank(bank.id, renameValue.trim());
                    setRenamingId(null);
                  }}
                >
                  <input
                    autoFocus
                    aria-label="Nome do banco"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 min-w-0 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
                  />
                  <Button type="submit" className="!px-4">
                    Salvar
                  </Button>
                  <Button type="button" variant="ghost" className="!px-3" onClick={() => setRenamingId(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between">
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
                  </div>
                  <div className="flex justify-end gap-4 mt-3 text-xs">
                    <button
                      type="button"
                      className="text-[var(--color-accent)] min-h-[32px]"
                      onClick={() => {
                        setRenamingId(bank.id);
                        setRenameValue(bank.name);
                      }}
                    >
                      Renomear
                    </button>
                    {confirmRemoveId === bank.id ? (
                      <button type="button" className="text-[var(--color-negative)] font-semibold min-h-[32px]" onClick={() => removeBank(bank.id)}>
                        Confirmar: remove o banco e as contas dele
                      </button>
                    ) : (
                      <button type="button" className="text-[var(--color-text-faint)] min-h-[32px]" onClick={() => setConfirmRemoveId(bank.id)}>
                        Remover
                      </button>
                    )}
                  </div>
                </>
              )}
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

      <Button as={Link} to="/app/imports/new" variant="outline" className="w-full flex items-center justify-center gap-2">
        <Upload size={18} />
        Importar extrato (CSV/OFX)
      </Button>

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
        <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
          + Adicionar banco manualmente
        </Button>
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
