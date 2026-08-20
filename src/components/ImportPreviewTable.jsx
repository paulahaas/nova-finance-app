import { Check, Copy } from 'lucide-react';
import clsx from 'clsx';
import Panel from './Panel';
import SelectMenu from './SelectMenu';
import { formatCurrency, formatDate } from '../utils/format';
import { buildDemoCategories } from '../data/demoData';
import { UNCATEGORIZED } from '../services/statement/categorizer.js';

const CATEGORY_OPTIONS = [...buildDemoCategories(), 'Entrada', UNCATEGORIZED].map((c) => ({ value: c, label: c }));

function ConfidenceBadge({ confidence, source }) {
  if (source === 'uncategorized') {
    return <span className="text-xs text-[var(--color-warning)]">Revisar</span>;
  }
  if (source === 'user-edit') {
    return <span className="text-xs text-[var(--color-text-faint)]">Editado</span>;
  }
  const pct = Math.round(confidence * 100);
  const label = source === 'user-rule' ? 'Sua regra' : source === 'keyword-rule' ? 'Regra' : `${pct}%`;
  return <span className="text-xs text-[var(--color-text-faint)]">{label}</span>;
}

/**
 * @param {{ transactions: object[], onChange: (index: number, patch: object) => void }} props
 */
export default function ImportPreviewTable({ transactions, onChange }) {
  const included = transactions.filter((t) => t.include).length;
  const duplicates = transactions.filter((t) => t.isDuplicate).length;
  const needsReview = transactions.filter((t) => t.category === UNCATEGORIZED).length;

  return (
    <div className="space-y-4">
      <Panel className="!p-4">
        <p className="text-sm text-[var(--color-text-dim)]">
          <strong className="text-[var(--color-text)]">{transactions.length}</strong> transações encontradas ·{' '}
          <strong className="text-[var(--color-text)]">{included}</strong> selecionadas para importar
          {needsReview > 0 && (
            <>
              {' '}· <strong className="text-[var(--color-warning)]">{needsReview}</strong> precisam de revisão
            </>
          )}
          {duplicates > 0 && (
            <>
              {' '}· <strong className="text-[var(--color-text)]">{duplicates}</strong> possíveis duplicatas
            </>
          )}
        </p>
      </Panel>

      <div className="space-y-2">
        {transactions.map((tx, i) => (
          <Panel
            key={i}
            className={clsx(
              // relative + focus-within:z-20 lifts this row (and its open
              // SelectMenu dropdown) above later rows in the list — Panel's
              // animate-fade-in-up leaves a lingering transform, which makes
              // every row its own stacking context, so a dropdown's own
              // z-20 alone isn't enough to paint over a later sibling row.
              '!p-4 flex items-center gap-3 relative focus-within:z-20',
              !tx.include && 'opacity-50'
            )}
          >
            <button
              type="button"
              onClick={() => onChange(i, { include: !tx.include })}
              className={clsx(
                'shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors',
                tx.include
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                  : 'border-[var(--color-border)]'
              )}
              aria-label={tx.include ? 'Remover da importação' : 'Incluir na importação'}
            >
              {tx.include && <Check size={14} className="text-white" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{tx.description}</p>
                {tx.isDuplicate && (
                  <span className="shrink-0 flex items-center gap-1 text-xs text-[var(--color-warning)]">
                    <Copy size={12} /> duplicata
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-dim)]">{formatDate(tx.date)}</p>
            </div>

            <div className="shrink-0 w-40">
              <SelectMenu
                value={tx.category}
                onChange={(category) => onChange(i, { category, categorySource: 'user-edit' })}
                options={CATEGORY_OPTIONS}
                triggerClassName="w-full flex items-center justify-between gap-1 min-h-[36px] rounded-lg px-3 text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)]"
              />
              <div className="mt-1 text-right">
                <ConfidenceBadge confidence={tx.confidence} source={tx.categorySource} />
              </div>
            </div>

            <p
              className={clsx(
                'shrink-0 w-24 text-right font-medium tabular',
                tx.type === 'income' ? 'text-[var(--color-positive)]' : 'text-[var(--color-text)]'
              )}
            >
              {tx.type === 'income' ? '+ ' : '− '}
              {formatCurrency(Math.abs(tx.amount))}
            </p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
