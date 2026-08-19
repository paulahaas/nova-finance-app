import Panel from '../components/Panel';
import { useData } from '../contexts/DataContext';

export default function Alerts() {
  const { alerts } = useData();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Alertas</h1>
      <div className="space-y-3">
        {alerts.map((a) => (
          <Panel key={a.id} className="flex items-start gap-3">
            <span className="text-xl">{a.icon}</span>
            <p className="text-sm">{a.message}</p>
          </Panel>
        ))}
        {alerts.length === 0 && <p className="text-sm text-[var(--color-text-dim)]">Nenhum alerta no momento.</p>}
      </div>
    </div>
  );
}
