import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { canExportData } from '../../config/permissions';
import { clearAll } from '../../services/storageService';

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
  const { user, logout } = useAuth();
  const data = useData();
  const [showUpgrade, setShowUpgrade] = useState(false);
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

  function handleDeleteAccount() {
    if (!confirm('Isso apagará todos os seus dados locais do NOVA. Deseja continuar?')) return;
    clearAll();
    logout();
    navigate('/welcome');
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
        <button
          onClick={handleDeleteAccount}
          className="w-full text-sm text-[var(--color-negative)] text-left"
        >
          Excluir conta
        </button>
      </Panel>

      <Button variant="ghost" className="w-full" onClick={() => { logout(); navigate('/welcome'); }}>
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
