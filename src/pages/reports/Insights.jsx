import Panel from '../../components/Panel';
import { useData } from '../../contexts/DataContext';
import { buildInsights } from '../../services/insightsService';

export default function Insights() {
  const { transactions, subscriptions } = useData();
  const insights = buildInsights({ transactions, subscriptions });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Insights</h1>

      {insights.length === 0 ? (
        <Panel className="text-center">
          <p className="text-sm text-[var(--color-text-dim)]">
            Ainda não há dados suficientes. Registre ou importe transações e os insights aparecem aqui.
          </p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {insights.map((i, idx) => (
            <Panel key={idx} className={idx === 0 ? 'shimmer-border' : ''}>
              <p className="text-sm">
                {i.icon} {i.text}
              </p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
