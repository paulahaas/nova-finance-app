import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canExportData } from '../../config/permissions';
import { friendlyAuthError } from '../../utils/authErrors';

const SECTIONS = [
  'Notificações',
  'Segurança',
  'Privacidade',
  'Aparência',
  'Moeda',
  'Categorias',
  'Metas',
  'Bancos',
  'Cartões',
];

export default function Settings() {
  const { user, logout, deleteAccount } = useAuth();
  const data = useData();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const exportAllowed = canExportData(user);

  function handleExport() {
    if (!exportAllowed) {
      setShowUpgrade(true);
      return;
    }
    const payload = {
      user,
      banks: data.banks,
      accounts: data.accounts,
      transactions: data.transactions,
      cards: data.cards,
      goals: data.goals,
      subscriptions: data.subscriptions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nova-dados.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError('');
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(friendlyAuthError(err));
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <Panel className="divide-y divide-[var(--color-border)]">
        {SECTIONS.map((s) => (
          <button key={s} className="w-full flex items-center justify-between py-3 text-sm text-left first:pt-0 last:pb-0">
            {s}
            <span className="text-[var(--color-text-faint)]">›</span>
          </button>
        ))}
      </Panel>

      <Panel>
        <button onClick={handleExport} className="w-full flex items-center justify-between text-sm">
          Exportar dados
          <span className="text-[var(--color-text-faint)]">›</span>
        </button>
      </Panel>

      <Panel>
        <button onClick={() => navigate('/app/help')} className="w-full flex items-center justify-between text-sm">
          Ajuda
          <span className="text-[var(--color-text-faint)]">›</span>
        </button>
      </Panel>

      <Panel>
        {confirmingDelete ? (
          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
            <p className="text-sm text-[var(--color-text-dim)]">
              Isso apaga <strong className="text-[var(--color-text)]">para sempre</strong> todos os seus dados
              (transações, cartões, metas...) e a sua conta. Não dá pra desfazer. Digite sua senha para confirmar.
            </p>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Senha"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 text-base outline-none focus:border-[var(--color-negative)]"
            />
            {deleteError && <p className="text-sm text-[var(--color-negative)]">{deleteError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={deleting} className="!bg-[var(--color-negative)] hover:!bg-[var(--color-negative)]">
                {deleting ? 'Apagando...' : 'Apagar tudo'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={deleting}
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="w-full min-h-[44px] text-sm text-[var(--color-negative)] text-left"
          >
            Excluir conta
          </button>
        )}
      </Panel>

      <Button variant="ghost" className="w-full" onClick={() => { logout(); navigate('/login'); }}>
        Sair
      </Button>

      {showUpgrade && (
        <UpgradeSheet
          title="Exportação de dados é exclusiva do NOVA Pro"
          description="Exporte seu histórico financeiro completo em formato aberto."
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
