import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Papa from 'papaparse';
import { friendlyAuthError } from '../../utils/authErrors';

export default function Settings() {
  const { user, logout, deleteAccount } = useAuth();
  const data = useData();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  function download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJson() {
    const payload = {
      user,
      banks: data.banks,
      accounts: data.accounts,
      transactions: data.transactions,
      cards: data.cards,
      goals: data.goals,
      subscriptions: data.subscriptions,
    };
    download('nova-dados.json', JSON.stringify(payload, null, 2), 'application/json');
  }

  // Semicolon-delimited with a BOM so Excel (pt-BR) opens the accents and
  // columns correctly.
  function handleExportCsv() {
    const bankName = (id) => data.banks.find((b) => b.id === id)?.name ?? '';
    const rows = [...data.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((t) => ({
        Data: new Date(t.date).toLocaleDateString('pt-BR'),
        Descrição: t.description,
        Categoria: t.category,
        Tipo: t.type === 'income' ? 'Entrada' : 'Saída',
        Valor: String(t.amount).replace('.', ','),
        Banco: bankName(t.bankId),
      }));
    download('nova-transacoes.csv', '﻿' + Papa.unparse(rows, { delimiter: ';' }), 'text/csv;charset=utf-8');
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
        <button onClick={handleExportCsv} className="w-full min-h-[44px] flex items-center justify-between text-sm pb-3">
          Exportar transações (CSV/Excel)
          <span className="text-[var(--color-text-faint)]">›</span>
        </button>
        <button onClick={handleExportJson} className="w-full min-h-[44px] flex items-center justify-between text-sm pt-3">
          Backup completo (JSON)
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
    </div>
  );
}
