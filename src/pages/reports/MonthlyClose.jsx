import { useMemo, useState } from 'react';
import Panel from '../../components/Panel';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { generateMonthlyClose } from '../../services/aiService';
import { monthKeyLabel } from '../../services/monthlyCloseService';
import { formatCurrency } from '../../utils/format';

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function ReportView({ payload, onApplyBudgets, applying, applied, readOnly = false }) {
  const { report, narrative } = payload;
  return (
    <div className="space-y-4">
      {narrative && (
        <Panel className="!p-4 bg-[var(--color-surface-2)]">
          <p className="text-sm">{narrative}</p>
        </Panel>
      )}

      <Panel className="!p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Entradas</p>
            <p className="font-semibold tabular text-sm">{formatCurrency(report.income)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Gastos</p>
            <p className="font-semibold tabular text-sm">{formatCurrency(report.expenses)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-dim)] mb-1">Economia</p>
            <p
              className={`font-semibold tabular text-sm ${report.netSavings >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}
            >
              {formatCurrency(report.netSavings)}
            </p>
          </div>
        </div>
      </Panel>

      {report.cutSuggestions.length > 0 && (
        <Panel className="!p-4">
          <p className="font-medium mb-3">Sugestões de corte</p>
          <div className="space-y-2">
            {report.cutSuggestions.map((c) => (
              <p key={c.category} className="text-sm text-[var(--color-text-dim)]">
                <span className="text-[var(--color-text)]">{c.category}</span>: {formatCurrency(c.amount)} este mês contra{' '}
                {formatCurrency(c.avgPrior)} de média — cortar {formatCurrency(c.suggestedCut)} te traz de volta à média.
              </p>
            ))}
          </div>
        </Panel>
      )}

      {report.categoryTotals.length > 0 && (
        <Panel className="!p-4">
          <p className="font-medium mb-3">Gastos por categoria</p>
          <div className="space-y-2">
            {report.categoryTotals.map((row) => (
              <div key={row.category} className="flex justify-between text-sm">
                <span>{row.category}</span>
                <span className="tabular text-[var(--color-text-dim)]">
                  {formatCurrency(row.amount)}
                  {row.avgPrior > 0 && ` (média ${formatCurrency(row.avgPrior)})`}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {report.forgottenSubscriptions.length > 0 && (
        <Panel className="!p-4">
          <p className="font-medium mb-3">Assinaturas pequenas, fáceis de esquecer</p>
          <div className="space-y-1">
            {report.forgottenSubscriptions.map((s) => (
              <p key={s.id} className="text-sm text-[var(--color-text-dim)]">
                {s.name}: {formatCurrency(s.amount)}/mês
              </p>
            ))}
          </div>
        </Panel>
      )}

      {Object.keys(report.suggestedBudgets).length > 0 && (
        <Panel className="!p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-medium">Orçamento sugerido pro mês seguinte</p>
            {!readOnly && (
              <Button onClick={onApplyBudgets} disabled={applying} className="!px-4 !py-2 text-xs shrink-0">
                {applied ? 'Aplicado ✓' : applying ? 'Aplicando...' : 'Aplicar'}
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {Object.entries(report.suggestedBudgets).map(([category, value]) => (
              <div key={category} className="flex justify-between text-sm text-[var(--color-text-dim)]">
                <span>{category}</span>
                <span className="tabular">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {report.goalPace && (
        <Panel className="!p-4">
          <p className="font-medium mb-2">Meta: {report.goalPace.goalName}</p>
          <p className="text-sm text-[var(--color-text-dim)]">
            Plano: {formatCurrency(report.goalPace.plannedMonthly)}/mês. Você guardou{' '}
            {formatCurrency(report.goalPace.actualContribution)} este mês —{' '}
            {report.goalPace.aheadDays > 0
              ? `isso adianta a meta em cerca de ${report.goalPace.aheadDays} dias.`
              : report.goalPace.aheadDays < 0
                ? `isso atrasa a meta em cerca de ${Math.abs(report.goalPace.aheadDays)} dias.`
                : 'exatamente no ritmo planejado.'}
          </p>
        </Panel>
      )}
    </div>
  );
}

export default function MonthlyClose() {
  const { getIdToken } = useAuth();
  const { monthlyReports, setCategoryBudget } = useData();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [override, setOverride] = useState(null);

  const currentMonth = monthKeyLabel();
  const stored = useMemo(() => monthlyReports.find((r) => r.month === currentMonth), [monthlyReports, currentMonth]);
  const current = override ?? stored;
  const pastReports = monthlyReports.filter((r) => r.month !== currentMonth);

  async function generate() {
    setGenerating(true);
    setError('');
    setApplied(false);
    try {
      const payload = await generateMonthlyClose({ getIdToken });
      setOverride(payload);
    } catch (err) {
      setError(err.message || 'Não consegui gerar o fechamento do mês.');
    } finally {
      setGenerating(false);
    }
  }

  async function applyBudgets() {
    if (!current) return;
    setApplying(true);
    try {
      await Promise.all(Object.entries(current.report.suggestedBudgets).map(([category, value]) => setCategoryBudget(category, value)));
      setApplied(true);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Fechamento do mês</h1>
        <Button onClick={generate} disabled={generating} variant={current ? 'outline' : 'primary'} className="!px-4 !py-2 text-sm shrink-0">
          {generating ? 'Gerando...' : current ? 'Gerar novamente' : 'Gerar fechamento'}
        </Button>
      </div>

      {error && (
        <Panel className="!p-4">
          <p className="text-sm text-[var(--color-negative)]">{error}</p>
        </Panel>
      )}

      {!current && !generating && (
        <Panel className="text-center">
          <p className="text-sm text-[var(--color-text-dim)]">
            Gere o fechamento de {monthLabel(currentMonth)}: total por categoria, sugestões de corte e orçamento pro mês seguinte.
          </p>
        </Panel>
      )}

      {current && <ReportView payload={current} onApplyBudgets={applyBudgets} applying={applying} applied={applied} />}

      {pastReports.length > 0 && (
        <div className="space-y-3">
          <p className="font-medium text-sm text-[var(--color-text-dim)]">Meses anteriores</p>
          {pastReports.map((r) => (
            <details key={r.month}>
              <summary className="cursor-pointer text-sm py-2">{monthLabel(r.month)}</summary>
              <div className="mt-3">
                <ReportView payload={r} readOnly />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
