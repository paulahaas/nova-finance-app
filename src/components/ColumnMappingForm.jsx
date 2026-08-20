import { useState } from 'react';
import Panel from './Panel';
import Button from './Button';
import SelectMenu from './SelectMenu';

/**
 * Shown when the CSV parser can't confidently auto-detect columns (spec
 * section 4) — lets the user tell NOVA which raw column is which.
 * @param {{ headers: string[], initialColumns: object, onConfirm: (columnMap: object) => void, onCancel: () => void }} props
 */
export default function ColumnMappingForm({ headers, initialColumns, onConfirm, onCancel }) {
  const headerOptions = headers.map((h) => ({ value: h, label: h }));
  const [dateCol, setDateCol] = useState(initialColumns.dateCol ?? '');
  const [descriptionCol, setDescriptionCol] = useState(initialColumns.descriptionCol ?? '');
  const [singleAmount, setSingleAmount] = useState(!initialColumns.debitCol && !initialColumns.creditCol);
  const [amountCol, setAmountCol] = useState(initialColumns.amountCol ?? '');
  const [debitCol, setDebitCol] = useState(initialColumns.debitCol ?? '');
  const [creditCol, setCreditCol] = useState(initialColumns.creditCol ?? '');

  const isValid = dateCol && descriptionCol && (singleAmount ? amountCol : debitCol || creditCol);

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    onConfirm(
      singleAmount
        ? { dateCol, descriptionCol, amountCol }
        : { dateCol, descriptionCol, debitCol: debitCol || null, creditCol: creditCol || null }
    );
  }

  return (
    <Panel>
      <h2 className="text-lg font-semibold mb-1">Confirme as colunas do seu extrato</h2>
      <p className="text-sm text-[var(--color-text-dim)] mb-6">
        Identificamos seu arquivo, mas precisamos confirmar quais colunas representam cada informação.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Data">
          <SelectMenu value={dateCol} onChange={setDateCol} options={headerOptions} placeholder="Selecione a coluna" />
        </Field>
        <Field label="Descrição">
          <SelectMenu value={descriptionCol} onChange={setDescriptionCol} options={headerOptions} placeholder="Selecione a coluna" />
        </Field>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSingleAmount(true)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm ${singleAmount ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)]'}`}
          >
            Uma coluna de valor
          </button>
          <button
            type="button"
            onClick={() => setSingleAmount(false)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm ${!singleAmount ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)]'}`}
          >
            Colunas separadas
          </button>
        </div>

        {singleAmount ? (
          <Field label="Valor">
            <SelectMenu value={amountCol} onChange={setAmountCol} options={headerOptions} placeholder="Selecione a coluna" />
          </Field>
        ) : (
          <>
            <Field label="Débito (saídas)">
              <SelectMenu value={debitCol} onChange={setDebitCol} options={headerOptions} placeholder="Selecione a coluna" />
            </Field>
            <Field label="Crédito (entradas)">
              <SelectMenu value={creditCol} onChange={setCreditCol} options={headerOptions} placeholder="Selecione a coluna" />
            </Field>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={!isValid} className="flex-1">
            Continuar
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-sm text-[var(--color-text-dim)] mb-1.5">{label}</p>
      {children}
    </div>
  );
}
