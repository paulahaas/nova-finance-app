import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import SelectMenu from '../../components/SelectMenu';
import Dropzone from '../../components/Dropzone';
import ColumnMappingForm from '../../components/ColumnMappingForm';
import ImportPreviewTable from '../../components/ImportPreviewTable';
import UpgradeSheet from '../../components/UpgradeSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { readStatementFile, getImportQuota, parseStatement, confirmStatement } from '../../services/statementImportService';

export default function ImportStatement() {
  const { user, getIdToken } = useAuth();
  const data = useData();
  const { banks } = data;
  const navigate = useNavigate();

  const [step, setStep] = useState('upload'); // upload | mapping | preview | done
  const [bankId, setBankId] = useState(banks[0]?.id ?? '');
  const [fileInfo, setFileInfo] = useState(null); // { filename, content }
  const [pendingMapping, setPendingMapping] = useState(null); // { headers, columns }
  const [preview, setPreview] = useState(null); // parseStatement() result
  const [batchId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getImportQuota({ getIdToken, user, importBatches: data.importBatches }).then(setQuota);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Banks load asynchronously from Firestore, so banks[0] can still be
  // undefined at the useState() initializer above — pick a default once
  // the list actually arrives, without overriding a choice the user made.
  useEffect(() => {
    if (!bankId && banks.length > 0) setBankId(banks[0].id);
  }, [banks, bankId]);

  async function handleFile(file) {
    setError('');
    setFileInfo(null);
    if (!file) return;

    const isValidExt = /\.(csv|ofx)$/i.test(file.name);
    if (!isValidExt) {
      setError('Não conseguimos identificar um formato de extrato válido neste arquivo.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Esse arquivo é muito grande. O limite é 5 MB.');
      return;
    }

    try {
      const info = await readStatementFile(file);
      setFileInfo(info);
    } catch {
      setError('Não conseguimos ler esse arquivo. Tente exportá-lo novamente do seu banco.');
    }
  }

  async function useDemoFile() {
    setError('');
    try {
      const res = await fetch('/demo/extrato-demo.csv');
      const content = await res.text();
      setFileInfo({ filename: 'extrato-demo.csv', content });
    } catch {
      setError('Não conseguimos carregar o arquivo de exemplo agora.');
    }
  }

  async function runParse(columnMap) {
    if (quota && !quota.allowed) {
      setShowUpgrade(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await parseStatement({
        getIdToken,
        filename: fileInfo.filename,
        content: fileInfo.content,
        bankId,
        columnMap,
        user,
        data,
      });
      if (result.needsMapping) {
        setPendingMapping({ headers: result.headers, columns: result.columns });
        setStep('mapping');
      } else {
        setPreview(result);
        setStep('preview');
      }
    } catch (err) {
      setError(err.message || 'Não conseguimos processar esse extrato.');
    } finally {
      setBusy(false);
    }
  }

  function handleRowChange(index, patch) {
    setPreview((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  }

  async function handleConfirm() {
    setBusy(true);
    setError('');
    try {
      const confirmResult = await confirmStatement({
        getIdToken,
        batchId,
        bankId,
        filename: fileInfo.filename,
        format: preview.format,
        transactions: preview.transactions,
        user,
        data,
      });
      setResult(confirmResult);
      setStep('done');
    } catch (err) {
      setError(err.message || 'Não conseguimos concluir a importação.');
    } finally {
      setBusy(false);
    }
  }

  if (banks.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Importar extrato</h1>
        <Panel className="text-center">
          <p className="text-[var(--color-text-dim)] mb-4">Adicione um banco antes de importar um extrato.</p>
          <Button onClick={() => navigate('/app/banks')}>Adicionar banco</Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Importar extrato</h1>
        {quota && quota.plan === 'free' && (
          <span className="text-sm text-[var(--color-text-dim)]">
            {quota.importsThisMonth} de {quota.limit} importações este mês
          </span>
        )}
      </div>

      {step === 'upload' && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--color-text-dim)] mb-1.5">Banco</p>
            <SelectMenu
              value={bankId}
              onChange={setBankId}
              options={banks.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>

          <Dropzone onFile={handleFile} error={error} />

          <div className="text-center">
            <button
              type="button"
              onClick={useDemoFile}
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              Usar arquivo de exemplo
            </button>
            {fileInfo?.filename === 'extrato-demo.csv' && (
              <p className="text-xs text-[var(--color-text-dim)] mt-1">Arquivo de exemplo carregado.</p>
            )}
          </div>

          <Button className="w-full" disabled={!fileInfo || busy} onClick={() => runParse(null)}>
            {busy ? 'Processando...' : 'Processar arquivo'}
          </Button>
        </div>
      )}

      {step === 'mapping' && pendingMapping && (
        <ColumnMappingForm
          headers={pendingMapping.headers}
          initialColumns={pendingMapping.columns}
          onConfirm={(columnMap) => runParse(columnMap)}
          onCancel={() => setStep('upload')}
        />
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <ImportPreviewTable transactions={preview.transactions} onChange={handleRowChange} />
          {error && <p className="text-sm text-[var(--color-negative)]">{error}</p>}
          <div className="flex gap-3">
            <Button className="flex-1" disabled={busy} onClick={handleConfirm}>
              {busy ? 'Importando...' : 'Confirmar importação'}
            </Button>
            <Button variant="ghost" onClick={() => setStep('upload')} disabled={busy}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <Panel className="text-center">
          <p className="text-3xl mb-3">✓</p>
          <h2 className="text-lg font-semibold mb-1">Importação concluída</h2>
          <p className="text-[var(--color-text-dim)] mb-6">
            {result.imported} transações foram adicionadas à sua conta.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/app/transactions')}>Ver transações</Button>
            <Button variant="ghost" onClick={() => navigate('/app/imports')}>
              Ver histórico
            </Button>
          </div>
        </Panel>
      )}

      {showUpgrade && (
        <UpgradeSheet
          title="Limite de importações atingido"
          description="Seu plano gratuito permite algumas importações por mês. Faça upgrade para o NOVA Pro para importar sem limites."
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
