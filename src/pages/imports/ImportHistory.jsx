import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import { useData } from '../../contexts/DataContext';
import { formatDate } from '../../utils/format';

export default function ImportHistory() {
  const { importBatches, banks } = useData();
  const sorted = [...importBatches].sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt));

  function bankName(bankId) {
    return banks.find((b) => b.id === bankId)?.name ?? 'Banco';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Histórico de importações</h1>
        <Button as={Link} to="/app/imports/new" variant="outline">
          + Nova importação
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Panel className="text-center">
          <p className="text-[var(--color-text-dim)]">Você ainda não importou nenhum extrato.</p>
        </Panel>
      ) : (
        <div className="space-y-2">
          {sorted.map((batch) => (
            <Panel key={batch.id} className="!p-4 flex items-center gap-3">
              <FileText size={20} className="shrink-0 text-[var(--color-accent)]" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{batch.filename}</p>
                <p className="text-sm text-[var(--color-text-dim)]">
                  {bankName(batch.bankId)} · {formatDate(batch.importedAt)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium tabular">{batch.transactionCount} transações</p>
                {batch.duplicateCount > 0 && (
                  <p className="text-xs text-[var(--color-text-faint)]">{batch.duplicateCount} duplicatas</p>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
